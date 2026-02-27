# Sentinel AI — FastAPI backend (S3-01)
# All ML endpoints + GPT-4o intelligence briefs. See GitHub Issue #21.
# Architecture: pre-compute all country scores at startup; dashboard/countries/anomalies read from cache; only GPT-4o briefs on-demand.

import asyncio
import json
import os
import random
import time
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

from backend.ml.pipeline import (
    FEATURE_COLUMNS,
    MONITORED_COUNTRIES,
    SentinelFeaturePipeline,
)
from backend.ml.risk_scorer import predict_risk, level_from_score
from backend.ml.anomaly import detect_anomaly
from backend.ml.sentiment import load_finbert, analyze_headlines_sentiment
from backend.ml.forecaster import forecast_risk, SEQUENCE_FEATURES
from backend.ml.tracker import PredictionTracker

ROOT = Path(__file__).resolve().parents[1]
MODEL_VERSION = "2.0.0"

# --- Pydantic models ---
class AnalyzeRequest(BaseModel):
    country: str
    countryCode: str


class RiskScoreRequest(BaseModel):
    country: str
    countryCode: str


class ForecastRequest(BaseModel):
    country: str
    countryCode: str


# --- Pre-computed caches (filled at startup, refreshed every 15 min) ---
_country_scores: dict = {}  # code -> {riskScore, riskLevel, isAnomaly, anomalyScore, severity, features, computedAt, name, risk_prediction, anomaly}
_dashboard_summary: dict = {}  # full dashboard summary JSON
_previous_summary: dict = {}  # for delta computation (globalThreatIndex, highPlusCountries)

# Legacy cache for /api/analyze brief responses (optional; analyze now uses _country_scores + GPT-4o on-demand)
_cache: dict = {}
_cache_ttl: dict = {}
CACHE_TTL_SECONDS = 900

# --- Derived state for new dashboard endpoints (populated by _post_rebuild_hook) ---
_previous_country_scores: dict = {}   # snapshot of _country_scores for delta detection
_previous_sub_scores: dict = {}       # previous sub-score values for delta computation
_alerts_history: list = []            # accumulated alerts, max 50
_kpi_history: list = []               # daily KPI snapshots, max 30
_gti_history: list = []               # last 5 GTI values for trend arrow
_activity_feed: list = []             # recent activity items, max 30


def is_cache_valid(country_code: str) -> bool:
    if country_code not in _cache_ttl:
        return False
    return (datetime.utcnow() - _cache_ttl[country_code]).total_seconds() < CACHE_TTL_SECONDS


# --- Data loading ---
def load_gdelt_cache(country_code: str) -> pd.DataFrame:
    path = ROOT / "data" / "gdelt" / f"{country_code}_events.csv"
    return pd.read_csv(path) if path.exists() else pd.DataFrame()


def load_acled_cache(country: str) -> pd.DataFrame:
    safe = country.lower().replace(" ", "_")
    path = ROOT / "data" / "acled" / f"{safe}.csv"
    return pd.read_csv(path) if path.exists() else pd.DataFrame()


def load_ucdp_cache(country: str) -> pd.DataFrame:
    safe = country.lower().replace(" ", "_")
    path = ROOT / "data" / "ucdp" / f"{safe}_ged.csv"
    if not path.exists():
        ucdp_dir = ROOT / "data" / "ucdp"
        if ucdp_dir.exists():
            alts = list(ucdp_dir.glob(f"*{safe}*ged*.csv"))
            path = alts[0] if alts else None
    return pd.read_csv(path) if path and path.exists() else pd.DataFrame()


def load_wb_cache(country_code: str) -> dict:
    info = MONITORED_COUNTRIES.get(country_code.upper(), {})
    iso3 = info.get("iso3", country_code)
    path = ROOT / "data" / "world_bank" / f"{iso3}.json"
    if path.exists():
        with open(path, encoding="utf-8") as f:
            return json.load(f).get("features", {})
    return {}


# --- Headlines (NewsAPI) ---
async def fetch_headlines(country: str, max_headlines: int = 10) -> list[str]:
    api_key = os.getenv("NEWS_API")
    if not api_key:
        return []
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://newsapi.org/v2/everything",
                params={
                    "q": country,
                    "sortBy": "publishedAt",
                    "pageSize": max_headlines,
                    "apiKey": api_key,
                },
                timeout=10,
            )
            data = resp.json()
            return [a["title"] for a in data.get("articles", []) if a.get("title")]
    except Exception:
        return []


# --- GPT-4o ---
def build_gpt4o_context(country: str, risk_prediction: dict, anomaly: dict, finbert_results: dict, headlines: list, features: dict) -> str:
    return f"""
ML RISK ASSESSMENT FOR {country.upper()}:
- ML Risk Level: {risk_prediction.get('risk_level', 'N/A')} (Score: {risk_prediction.get('risk_score', 0)}/100)
- Model Confidence: {risk_prediction.get('confidence', 0):.0%}
- Anomaly Alert: {anomaly.get('is_anomaly', False)} (Severity: {anomaly.get('severity', 'LOW')})
- Headline Sentiment: {finbert_results.get('dominant_sentiment', 'neutral')} ({finbert_results.get('headline_escalatory_pct', 0):.0%} escalatory)
- Top ML Risk Drivers: {', '.join((risk_prediction.get('top_drivers') or [])[:3])}
- Data Sources: GDELT + ACLED + UCDP + World Bank + NewsAPI.ai

TODAY'S HEADLINES:
{chr(10).join(f'- {h}' for h in (headlines or [])[:5])}

TASK: Write an analyst-grade intelligence brief explaining WHY the ML model scored
{country} at {risk_prediction.get('risk_score', 0)}/100. Reference specific named actors, regions,
and mechanisms from the headlines. Do NOT invent the score — explain it.

Return valid JSON with these fields:
- riskScore (int 0-100, use {risk_prediction.get('risk_score', 0)})
- riskLevel (string, use "{risk_prediction.get('risk_level', 'MODERATE')}")
- summary (string, 2-3 sentence executive summary)
- keyFactors (array of 3-5 strings, each a specific risk driver)
- industries (array of affected industry strings)
- watchList (array of 3-5 things to monitor)
- causalChain (array of 7 strings showing step-by-step escalation chain from today's signals to predicted crisis)
- lastUpdated (ISO timestamp)

Return ONLY valid JSON. No markdown, no backticks, no explanation outside the JSON.
"""


async def call_gpt4o(ml_context: str, country: str, risk_prediction: dict) -> dict | None:
    if not os.getenv("OPENAI_API_KEY"):
        return None
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI()
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a geopolitical intelligence analyst. Return only valid JSON."},
                {"role": "user", "content": ml_context},
            ],
            temperature=0.3,
            max_tokens=1500,
        )
        text = response.choices[0].message.content.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(text)
    except Exception:
        return None


def _anomaly_input_from_features(features: dict) -> dict:
    """Map pipeline feature names to ANOMALY_FEATURES keys."""
    return {
        "goldstein_mean": features.get("gdelt_goldstein_mean", 0),
        "goldstein_std": features.get("gdelt_goldstein_std", 0),
        "goldstein_min": features.get("gdelt_goldstein_min", 0),
        "mentions_total": features.get("gdelt_event_count", 0),
        "avg_tone": features.get("gdelt_avg_tone", 0),
        "event_count": features.get("gdelt_event_count", 0),
    }


def _build_forecast_sequence(features: dict) -> "np.ndarray":
    """Build (90, 12) array from pipeline features for LSTM (repeat current row 90 times)."""
    import numpy as np
    risk = min(100.0, max(0.0, float(features.get("political_risk_score", features.get("conflict_composite", 0)))))
    row = [
        risk,
        float(features.get("gdelt_goldstein_mean", 0)),
        float(features.get("gdelt_event_count", 0)),
        float(features.get("acled_fatalities_30d", 0)),
        float(features.get("acled_battle_count", 0)),
        float(features.get("finbert_negative_score", 0)),
        float(features.get("wb_gdp_growth_latest", 0)),
        float(features.get("anomaly_score", 0)),
        float(features.get("gdelt_avg_tone", 0)),
        float(features.get("gdelt_event_acceleration", 0)),
        float(features.get("ucdp_conflict_intensity", 0)),
        float(features.get("econ_composite_score", 0)),
    ]
    return np.array([row] * 90, dtype=np.float32)


# Priority countries for demo (Pacific Ridge Industries exposure)
PRIORITY_COUNTRIES = ["UA", "TW", "IR", "VE", "PK", "ET", "RS", "BR"]


def _score_country(code: str, info: dict, features: dict) -> dict:
    """Score a single country: risk prediction + anomaly detection. Returns row dict."""
    try:
        pred = predict_risk(features)
        risk_score = pred["risk_score"]
        risk_level = pred["risk_level"]
    except FileNotFoundError:
        risk_score = 0
        risk_level = "LOW"
        pred = {
            "risk_level": risk_level,
            "risk_score": risk_score,
            "confidence": 0.5,
            "probabilities": {},
            "top_drivers": [],
        }

    anomaly_input = _anomaly_input_from_features(features)
    anomaly = detect_anomaly(code, anomaly_input)
    features["anomaly_score"] = anomaly["anomaly_score"]

    if anomaly["is_anomaly"]:
        risk_score = min(100, risk_score + int(anomaly["anomaly_score"] * 15))
        risk_level = level_from_score(risk_score)
        pred = dict(pred, risk_score=risk_score, risk_level=risk_level)

    computed_at = datetime.utcnow().isoformat() + "Z"
    _country_scores[code] = {
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "isAnomaly": anomaly["is_anomaly"],
        "anomalyScore": anomaly["anomaly_score"],
        "severity": anomaly["severity"],
        "features": features,
        "computedAt": computed_at,
        "name": info["name"],
        "risk_prediction": pred,
        "anomaly": anomaly,
    }
    return {
        "code": code,
        "name": info["name"],
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "isAnomaly": anomaly["is_anomaly"],
        "anomalyScore": anomaly["anomaly_score"],
    }


# --- Sub-score dimension definitions ---
_SUB_SCORE_DIMENSIONS = {
    "conflictIntensity": {
        "keys": ["acled_fatalities_30d", "acled_battle_count", "ucdp_conflict_intensity"],
        "description": "Armed conflict and battle-related fatalities",
    },
    "politicalInstability": {
        "keys": ["political_risk_score", "gdelt_goldstein_mean", "gdelt_goldstein_std"],
        "description": "Government instability and political risk signals",
    },
    "economicStress": {
        "keys": ["wb_gdp_growth_latest", "wb_inflation_latest", "econ_composite_score"],
        "description": "Economic deterioration and fiscal pressure",
    },
    "socialUnrest": {
        "keys": ["gdelt_event_count", "gdelt_event_acceleration", "gdelt_avg_tone"],
        "description": "Protest activity and social tension indicators",
    },
    "sentimentEscalation": {
        "keys": ["finbert_negative_score", "finbert_escalatory_pct", "sentiment_composite"],
        "description": "Media sentiment and escalatory language trends",
    },
}


def _detect_alerts(prev: dict, curr: dict, now: str) -> list[dict]:
    """Compare previous and current country scores; emit alerts for significant changes."""
    alerts = []
    for code, c in curr.items():
        p = prev.get(code)
        if not p:
            continue
        # TIER_CHANGE: risk level changed
        if p.get("riskLevel") != c["riskLevel"]:
            direction = "escalated" if c["riskScore"] > p.get("riskScore", 0) else "de-escalated"
            alerts.append({
                "type": "TIER_CHANGE",
                "country": c["name"],
                "code": code,
                "detail": f"{c['name']} {direction} from {p.get('riskLevel', '?')} to {c['riskLevel']}",
                "time": now,
                "severity": "high" if c["riskLevel"] in ("HIGH", "CRITICAL") else "medium",
            })
        # SCORE_SPIKE: score jumped by >=8 points
        score_delta = c["riskScore"] - p.get("riskScore", 0)
        if abs(score_delta) >= 8:
            alerts.append({
                "type": "SCORE_SPIKE",
                "country": c["name"],
                "code": code,
                "detail": f"{c['name']} risk score changed by {score_delta:+d} (now {c['riskScore']})",
                "time": now,
                "severity": "high" if abs(score_delta) >= 15 else "medium",
            })
        # ANOMALY_DETECTED: newly flagged anomaly
        if c["isAnomaly"] and not p.get("isAnomaly"):
            alerts.append({
                "type": "ANOMALY_DETECTED",
                "country": c["name"],
                "code": code,
                "detail": f"Anomaly detected in {c['name']} (score {c['anomalyScore']:.2f}, severity {c['severity']})",
                "time": now,
                "severity": c["severity"].lower() if c.get("severity") else "medium",
            })
    return alerts


def _generate_activity_items(prev: dict, curr: dict, now: str) -> list[dict]:
    """Generate activity feed items from score changes."""
    items = []
    for code, c in curr.items():
        p = prev.get(code)
        if not p:
            items.append({"time": now, "icon": "plus", "text": f"{c['name']} added to monitoring", "country": c['name'], "type": "new_country"})
            continue
        if p.get("riskLevel") != c["riskLevel"]:
            icon = "arrow-up" if c["riskScore"] > p.get("riskScore", 0) else "arrow-down"
            items.append({"time": now, "icon": icon, "text": f"{c['name']} moved to {c['riskLevel']}", "country": c["name"], "type": "tier_change"})
        if c["isAnomaly"] and not p.get("isAnomaly"):
            items.append({"time": now, "icon": "alert-triangle", "text": f"Anomaly detected in {c['name']}", "country": c["name"], "type": "anomaly"})
        score_delta = c["riskScore"] - p.get("riskScore", 0)
        if abs(score_delta) >= 5 and p.get("riskLevel") == c["riskLevel"]:
            direction = "increased" if score_delta > 0 else "decreased"
            items.append({"time": now, "icon": "trending-up" if score_delta > 0 else "trending-down",
                          "text": f"{c['name']} risk {direction} by {abs(score_delta)} pts", "country": c["name"], "type": "score_change"})
    return items


def _backfill_kpi_history() -> None:
    """Generate 30 days of synthetic KPI history using current values + gaussian noise."""
    global _kpi_history
    if _kpi_history:
        return  # already backfilled
    if not _dashboard_summary:
        return
    base_gti = _dashboard_summary.get("globalThreatIndex", 45)
    base_anomalies = _dashboard_summary.get("activeAnomalies", 2)
    base_high = _dashboard_summary.get("highPlusCountries", 3)
    base_escalation = _dashboard_summary.get("escalationAlerts24h", 1)
    now = datetime.utcnow()
    for i in range(30, 0, -1):
        day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        _kpi_history.append({
            "date": day,
            "globalThreatIndex": max(0, min(100, base_gti + int(random.gauss(0, 3)))),
            "activeAnomalies": max(0, base_anomalies + int(random.gauss(0, 1))),
            "highPlusCountries": max(0, base_high + int(random.gauss(0, 1))),
            "escalationAlerts24h": max(0, base_escalation + int(random.gauss(0, 0.8))),
        })


def _post_rebuild_hook(country_rows: list[dict]) -> None:
    """Called at end of _rebuild_dashboard_summary(); updates all derived state."""
    global _previous_country_scores, _alerts_history, _activity_feed, _kpi_history, _gti_history
    now = datetime.utcnow().isoformat() + "Z"

    # Build current lookup from country_rows
    curr = {}
    for r in country_rows:
        curr[r["code"]] = {
            "name": r["name"],
            "riskScore": r["riskScore"],
            "riskLevel": r["riskLevel"],
            "isAnomaly": r.get("isAnomaly", False),
            "anomalyScore": r.get("anomalyScore", 0),
            "severity": _country_scores.get(r["code"], {}).get("severity", "LOW"),
        }

    # Detect alerts
    new_alerts = _detect_alerts(_previous_country_scores, curr, now)
    _alerts_history = (new_alerts + _alerts_history)[:50]

    # Generate activity items
    new_items = _generate_activity_items(_previous_country_scores, curr, now)
    _activity_feed = (new_items + _activity_feed)[:30]

    # Backfill KPI history on first run
    _backfill_kpi_history()

    # Append today's KPI snapshot
    today = datetime.utcnow().strftime("%Y-%m-%d")
    if not _kpi_history or _kpi_history[-1]["date"] != today:
        _kpi_history.append({
            "date": today,
            "globalThreatIndex": _dashboard_summary.get("globalThreatIndex", 0),
            "activeAnomalies": _dashboard_summary.get("activeAnomalies", 0),
            "highPlusCountries": _dashboard_summary.get("highPlusCountries", 0),
            "escalationAlerts24h": _dashboard_summary.get("escalationAlerts24h", 0),
        })
        _kpi_history = _kpi_history[-30:]

    # Track GTI trend
    gti = _dashboard_summary.get("globalThreatIndex", 0)
    _gti_history.append(gti)
    _gti_history[:] = _gti_history[-5:]

    # Snapshot current state for next delta
    _previous_country_scores = {k: dict(v) for k, v in curr.items()}


def _rebuild_dashboard_summary(country_rows: list[dict]) -> None:
    """Rebuild _dashboard_summary from scored country rows."""
    global _dashboard_summary, _previous_summary
    risk_scores = [r["riskScore"] for r in country_rows]
    global_threat_index = round(sum(risk_scores) / len(risk_scores)) if risk_scores else 0
    prev_gti = _previous_summary.get("globalThreatIndex", global_threat_index)
    global_threat_index_delta = global_threat_index - prev_gti

    active_anomalies = sum(1 for r in country_rows if r["isAnomaly"])
    high_plus_countries = sum(1 for r in country_rows if r["riskLevel"] in ("HIGH", "CRITICAL"))
    prev_high = _previous_summary.get("highPlusCountries", high_plus_countries)
    high_plus_delta = high_plus_countries - prev_high

    escalation_alerts_24h = sum(1 for r in country_rows if r["anomalyScore"] > 0.5)
    accuracy_result = tracker.compute_accuracy(days_back=90)
    model_health = round(accuracy_result["accuracy_pct"], 1)

    countries_sorted = sorted(country_rows, key=lambda r: r["riskScore"], reverse=True)
    computed_at = datetime.utcnow().isoformat() + "Z"

    _dashboard_summary = {
        "globalThreatIndex": global_threat_index,
        "globalThreatIndexDelta": global_threat_index_delta,
        "activeAnomalies": active_anomalies,
        "highPlusCountries": high_plus_countries,
        "highPlusCountriesDelta": high_plus_delta,
        "escalationAlerts24h": escalation_alerts_24h,
        "modelHealth": model_health,
        "countries": countries_sorted,
        "computedAt": computed_at,
    }
    _previous_summary["globalThreatIndex"] = global_threat_index
    _previous_summary["highPlusCountries"] = high_plus_countries

    # Update derived state for new endpoints
    _post_rebuild_hook(country_rows)


async def _precompute_batch(codes: list[str]) -> list[dict]:
    """Compute features and score a batch of country codes. Returns list of row dicts."""
    all_features = SentinelFeaturePipeline.compute_all_countries(
        limit=len(codes), priority_codes=codes
    )
    rows = []
    for code in codes:
        info = MONITORED_COUNTRIES.get(code)
        if not info:
            continue
        features = all_features.get(code, {})
        rows.append(_score_country(code, info, features))
    return rows


async def _background_compute_remaining() -> None:
    """Compute all non-priority countries in background after server is up."""
    priority_set = set(PRIORITY_COUNTRIES)
    remaining = [c for c in MONITORED_COUNTRIES if c not in priority_set]
    if not remaining:
        return
    t0 = time.perf_counter()
    # Process in batches of 30 to avoid blocking the event loop too long
    BATCH = 30
    all_rows = []
    for i in range(0, len(remaining), BATCH):
        batch = remaining[i:i + BATCH]
        rows = await _precompute_batch(batch)
        all_rows.extend(rows)
        # Yield to event loop so API requests can be served between batches
        await asyncio.sleep(0)

    # Rebuild dashboard summary with ALL countries (priority + remaining)
    priority_rows = [
        {"code": c, "name": _country_scores[c]["name"],
         "riskScore": _country_scores[c]["riskScore"], "riskLevel": _country_scores[c]["riskLevel"],
         "isAnomaly": _country_scores[c]["isAnomaly"], "anomalyScore": _country_scores[c]["anomalyScore"]}
        for c in PRIORITY_COUNTRIES if c in _country_scores
    ]
    _rebuild_dashboard_summary(priority_rows + all_rows)
    elapsed = time.perf_counter() - t0
    print(f"Background: computed {len(all_rows)} remaining countries in {elapsed:.1f}s")


async def refresh_loop() -> None:
    """Background: full refresh every 15 minutes."""
    while True:
        await asyncio.sleep(900)
        all_codes = list(MONITORED_COUNTRIES.keys())
        rows = await _precompute_batch(all_codes)
        _rebuild_dashboard_summary(rows)
        print(f"Scores refreshed at {datetime.utcnow().isoformat()}Z — {len(rows)} countries")


# --- App ---
app = FastAPI(title="Sentinel AI API", version=MODEL_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tracker = PredictionTracker()


@app.on_event("startup")
async def startup():
    # Phase 1: compute priority countries so dashboard is usable immediately
    t0 = time.perf_counter()
    priority_rows = await _precompute_batch(PRIORITY_COUNTRIES)
    _rebuild_dashboard_summary(priority_rows)
    elapsed = time.perf_counter() - t0
    print(f"Phase 1: {len(priority_rows)} priority countries ready in {elapsed:.1f}s")

    # Phase 2: compute all remaining countries in background (non-blocking)
    asyncio.create_task(_background_compute_remaining())
    asyncio.create_task(refresh_loop())
    print("Sentinel AI backend ready — serving priority countries, computing rest in background")


@app.get("/")
async def root():
    """Simple root so the backend URL loads in a browser."""
    from fastapi.responses import HTMLResponse
    return HTMLResponse(
        "<!DOCTYPE html><html><body style='font-family:sans-serif;padding:2rem'>"
        "<h1>Sentinel AI API</h1><p>Backend is running.</p>"
        "<ul><li><a href='/health'>/health</a></li>"
        "<li><a href='/docs'>/docs</a> (Swagger)</li>"
        "<li><a href='/api/dashboard/summary'>/api/dashboard/summary</a></li></ul>"
        "</body></html>"
    )


@app.get("/health")
async def health():
    """Check API is up and ML model files are present."""
    risk_model = ROOT / "models" / "risk_scorer.pkl"
    encoder = ROOT / "models" / "risk_label_encoder.pkl"
    ml_ready = risk_model.exists() and encoder.exists()
    return {
        "status": "ok",
        "api": True,
        "ml": ml_ready,
        "version": MODEL_VERSION,
    }


def _validate_country(code: str) -> None:
    if code.upper() not in MONITORED_COUNTRIES:
        raise HTTPException(status_code=400, detail=f"Country code {code} not in monitored list")


@app.post("/api/analyze")
async def analyze_country(request: AnalyzeRequest):
    """Cached ML score from precompute + on-demand GPT-4o brief. Headlines fetched live for context."""
    country = request.country
    country_code = request.countryCode.strip().upper()
    _validate_country(country_code)

    if not _country_scores or country_code not in _country_scores:
        raise HTTPException(status_code=503, detail="Scores not yet computed; wait for backend startup to finish.")

    if is_cache_valid(country_code):
        return _cache[country_code]

    c = _country_scores[country_code]
    risk_prediction = c["risk_prediction"]
    anomaly = c["anomaly"]
    features = c["features"]

    headlines = await fetch_headlines(country)
    finbert_results = analyze_headlines_sentiment(headlines)

    tracker.log_prediction(country_code, risk_prediction, features, MODEL_VERSION)

    ml_context = build_gpt4o_context(country, risk_prediction, anomaly, finbert_results, headlines, features)
    brief = await call_gpt4o(ml_context, country, risk_prediction)

    if brief is None:
        brief = {
            "riskScore": risk_prediction["risk_score"],
            "riskLevel": risk_prediction["risk_level"],
            "summary": "ML risk assessment available; GPT-4o brief unavailable (missing OPENAI_API_KEY or API error).",
            "keyFactors": risk_prediction.get("top_drivers", [])[:5],
            "industries": [],
            "watchList": [],
            "causalChain": [],
            "lastUpdated": datetime.utcnow().isoformat() + "Z",
        }

    result = {
        **brief,
        "mlMetadata": {
            "riskScore": risk_prediction["risk_score"],
            "confidence": risk_prediction["confidence"],
            "riskLevel": risk_prediction["risk_level"],
            "anomalyDetected": anomaly["is_anomaly"],
            "anomalyScore": anomaly["anomaly_score"],
            "sentimentLabel": finbert_results.get("dominant_sentiment", "neutral"),
            "escalatoryPct": finbert_results.get("headline_escalatory_pct", 0),
            "topDrivers": risk_prediction.get("top_drivers", []),
            "dataSources": ["GDELT", "ACLED", "UCDP", "World Bank", "NewsAPI.ai"],
            "modelVersion": MODEL_VERSION,
        },
    }
    _cache[country_code] = result
    _cache_ttl[country_code] = datetime.utcnow()
    return result


@app.post("/api/risk-score")
async def api_risk_score(request: RiskScoreRequest):
    country_code = request.countryCode.strip().upper()
    _validate_country(country_code)
    country = request.country

    headlines = await fetch_headlines(country)
    finbert_results = analyze_headlines_sentiment(headlines)
    gdelt_df = load_gdelt_cache(country_code)
    acled_df = load_acled_cache(country)
    ucdp_df = load_ucdp_cache(country)
    wb_features = load_wb_cache(country_code)
    pipeline = SentinelFeaturePipeline(country_code, country)
    features = pipeline.compute(gdelt_df, acled_df, ucdp_df, wb_features, headlines, finbert_results)

    try:
        risk_prediction = predict_risk(features)
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Risk scorer not trained. Run: python -m backend.ml.risk_scorer")
    return risk_prediction


@app.get("/api/anomalies")
async def api_anomalies():
    """Return pre-computed anomaly flags for all countries (instant)."""
    if not _country_scores:
        raise HTTPException(status_code=503, detail="Scores not yet computed; wait for backend startup to finish.")
    return [
        {
            "countryCode": code,
            "country": c["name"],
            "isAnomaly": c["isAnomaly"],
            "anomalyScore": c["anomalyScore"],
            "severity": c["severity"],
        }
        for code, c in _country_scores.items()
    ]


@app.post("/api/forecast")
async def api_forecast(request: ForecastRequest):
    country_code = request.countryCode.strip().upper()
    _validate_country(country_code)
    country = request.country

    gdelt_df = load_gdelt_cache(country_code)
    acled_df = load_acled_cache(country)
    ucdp_df = load_ucdp_cache(country)
    wb_features = load_wb_cache(country_code)
    pipeline = SentinelFeaturePipeline(country_code, country)
    features = pipeline.compute(gdelt_df, acled_df, ucdp_df, wb_features)

    seq = _build_forecast_sequence(features)
    try:
        forecast = forecast_risk(seq)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "countryCode": country_code,
        "country": country,
        **forecast,
    }


@app.get("/api/countries")
async def api_countries():
    """Return pre-computed risk scores for all countries (instant)."""
    if not _country_scores:
        raise HTTPException(status_code=503, detail="Scores not yet computed; wait for backend startup to finish.")
    return [
        {
            "countryCode": code,
            "country": c["name"],
            "riskScore": c["riskScore"],
            "riskLevel": c["riskLevel"],
        }
        for code, c in _country_scores.items()
    ]


@app.get("/api/dashboard/summary")
async def api_dashboard_summary():
    """Return pre-computed dashboard KPIs (instant; no on-demand computation)."""
    if not _dashboard_summary:
        raise HTTPException(status_code=503, detail="Scores not yet computed; wait for backend startup to finish.")
    return _dashboard_summary


@app.get("/api/dashboard/sub-scores")
async def api_dashboard_sub_scores():
    """Weighted sub-score breakdown across 5 risk dimensions."""
    if not _country_scores:
        raise HTTPException(status_code=503, detail="Scores not yet computed; wait for backend startup to finish.")

    global _previous_sub_scores
    sub_scores = {}
    for dim, cfg in _SUB_SCORE_DIMENSIONS.items():
        values = []
        drivers = []
        for code, c in _country_scores.items():
            feats = c.get("features", {})
            dim_vals = [float(feats.get(k, 0)) for k in cfg["keys"]]
            avg = sum(dim_vals) / len(dim_vals) if dim_vals else 0
            values.append(avg)
            if avg > 0.5:
                drivers.append({"country": c["name"], "code": code, "value": round(avg, 2)})
        raw_avg = sum(values) / len(values) if values else 0
        # Normalize to 0-100 scale
        value = round(min(100, max(0, raw_avg * 10)), 1)
        prev_value = _previous_sub_scores.get(dim, value)
        delta = round(value - prev_value, 1)
        drivers_sorted = sorted(drivers, key=lambda d: d["value"], reverse=True)[:5]
        sub_scores[dim] = {
            "value": value,
            "delta": delta,
            "description": cfg["description"],
            "drivers": drivers_sorted,
        }
    _previous_sub_scores = {dim: sub_scores[dim]["value"] for dim in sub_scores}
    return {"subScores": sub_scores}


@app.get("/api/dashboard/alerts")
async def api_dashboard_alerts():
    """Return accumulated alerts from score changes."""
    return {"alerts": _alerts_history}


@app.get("/api/dashboard/kpis")
async def api_dashboard_kpis():
    """Rich KPI aggregation from pre-computed country scores."""
    if not _country_scores:
        raise HTTPException(status_code=503, detail="Scores not yet computed; wait for backend startup to finish.")

    scores = list(_country_scores.values())
    risk_values = [c["riskScore"] for c in scores]
    gti = round(sum(risk_values) / len(risk_values)) if risk_values else 0

    prev_gti = _gti_history[-2] if len(_gti_history) >= 2 else gti
    gti_delta = gti - prev_gti
    if len(_gti_history) >= 3:
        trend = "rising" if _gti_history[-1] > _gti_history[-3] else "falling" if _gti_history[-1] < _gti_history[-3] else "stable"
    else:
        trend = "stable"

    top_contributors = sorted(scores, key=lambda c: c["riskScore"], reverse=True)[:5]
    top_contributors_out = [{"name": c["name"], "score": c["riskScore"], "level": c["riskLevel"]} for c in top_contributors]

    active_anomalies = sum(1 for c in scores if c["isAnomaly"])

    risk_dist = {"CRITICAL": 0, "HIGH": 0, "MODERATE": 0, "LOW": 0}
    for c in scores:
        level = c["riskLevel"]
        if level in risk_dist:
            risk_dist[level] += 1

    # Regional breakdown
    region_map: dict[str, list] = {}
    for code, c in _country_scores.items():
        info = MONITORED_COUNTRIES.get(code, {})
        region = info.get("region", "Other")
        region_map.setdefault(region, []).append(c["riskScore"])
    regional_breakdown = {
        region: {"avgRisk": round(sum(vals) / len(vals), 1), "countries": len(vals)}
        for region, vals in region_map.items()
    }

    return {
        "globalThreatIndex": {"score": gti, "delta": gti_delta, "trend": trend, "topContributors": top_contributors_out},
        "activeAnomalies": active_anomalies,
        "riskDistribution": risk_dist,
        "regionalBreakdown": regional_breakdown,
        "totalMonitored": len(scores),
        "computedAt": datetime.utcnow().isoformat() + "Z",
    }


@app.get("/api/dashboard/kpis/history")
async def api_dashboard_kpis_history():
    """Return historical KPI data (30 days, synthetic backfill + live)."""
    _backfill_kpi_history()
    gti_values = [{"date": h["date"], "value": h["globalThreatIndex"]} for h in _kpi_history]
    anomaly_values = [{"date": h["date"], "value": h["activeAnomalies"]} for h in _kpi_history]
    high_values = [{"date": h["date"], "value": h["highPlusCountries"]} for h in _kpi_history]
    escalation_values = [{"date": h["date"], "value": h["escalationAlerts24h"]} for h in _kpi_history]
    return {
        "globalThreatIndex": {"period": "30d", "values": gti_values},
        "activeAnomalies": {"period": "30d", "values": anomaly_values},
        "highPlusCountries": {"period": "30d", "values": high_values},
        "escalationAlerts24h": {"period": "30d", "values": escalation_values},
    }


@app.get("/api/recent-activity")
async def api_recent_activity():
    """Return recent activity feed items."""
    items = list(_activity_feed)
    # Add tracker predictions as activity items
    try:
        record = tracker.get_track_record(limit=5)
        for pred in record:
            items.append({
                "time": pred.get("timestamp", datetime.utcnow().isoformat() + "Z"),
                "icon": "cpu",
                "text": f"ML prediction logged for {pred.get('country_code', '??')} — risk {pred.get('risk_score', 0)}",
                "country": pred.get("country_code", ""),
                "type": "prediction",
            })
    except Exception:
        pass
    items.sort(key=lambda x: x.get("time", ""), reverse=True)
    return {"items": items[:30]}


@app.get("/api/track-record")
async def api_track_record():
    record = tracker.get_track_record(limit=20)
    accuracy = tracker.compute_accuracy(days_back=90)
    return {"predictions": record, "accuracy": accuracy}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
