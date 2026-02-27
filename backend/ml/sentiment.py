# Sentinel AI — FinBERT sentiment analyzer (ProsusAI/finbert, pre-trained)
# S2-03: load once at startup, batch-analyze headlines, return 7 features + individual_results

from transformers import pipeline
import torch
import numpy as np

_finbert_pipeline = None


def load_finbert():
    """Download and cache ProsusAI/finbert (~440MB first run). GPU if available."""
    global _finbert_pipeline
    if _finbert_pipeline is None:
        print("Loading ProsusAI/finbert...")
        _finbert_pipeline = pipeline(
            "sentiment-analysis",
            model="ProsusAI/finbert",
            tokenizer="ProsusAI/finbert",
            device=0 if torch.cuda.is_available() else -1,
            max_length=512,
            truncation=True,
        )
        print("finbert loaded successfully")
    return _finbert_pipeline


def analyze_headlines_sentiment(headlines: list[str]) -> dict:
    """
    Batch-analyze headlines with FinBERT. Returns 8 aggregate keys + individual_results.
    Empty list returns neutral defaults.
    """
    if not headlines:
        return {
            "finbert_negative_score": 0.0,
            "finbert_positive_score": 0.0,
            "finbert_neutral_score": 1.0,
            "headline_volume": 0,
            "headline_escalatory_pct": 0.0,
            "media_negativity_index": 0.0,
            "sentiment_trend_7d": 0.0,
            "dominant_sentiment": "neutral",
            "individual_results": [],
        }
    pipe = load_finbert()
    batch_size = 16
    all_results = []
    for i in range(0, len(headlines), batch_size):
        batch = headlines[i : i + batch_size]
        results = pipe(batch)
        all_results.extend(results)
    # Aggregate scores
    neg_scores = [r["score"] for r in all_results if r["label"] == "negative"]
    pos_scores = [r["score"] for r in all_results if r["label"] == "positive"]
    neu_scores = [r["score"] for r in all_results if r["label"] == "neutral"]
    neg_pct = len(neg_scores) / max(len(all_results), 1)
    avg_neg = float(np.mean(neg_scores)) if neg_scores else 0.0
    avg_pos = float(np.mean(pos_scores)) if pos_scores else 0.0
    avg_neu = float(np.mean(neu_scores)) if neu_scores else 0.0
    counts = {
        "negative": len(neg_scores),
        "positive": len(pos_scores),
        "neutral": len(neu_scores),
    }
    dominant = max(counts, key=counts.get)
    # neutral_score: use mean of neutral when available, else 1 - neg - pos
    finbert_neutral = avg_neu if neu_scores else max(0.0, 1.0 - avg_neg - avg_pos)
    return {
        "finbert_negative_score": round(avg_neg, 3),
        "finbert_positive_score": round(avg_pos, 3),
        "finbert_neutral_score": round(finbert_neutral, 3),
        "headline_volume": len(headlines),
        "headline_escalatory_pct": round(neg_pct, 3),
        "media_negativity_index": round(avg_neg * neg_pct, 3),
        "sentiment_trend_7d": 0.0,
        "dominant_sentiment": dominant,
        "individual_results": [
            {"headline": h[:80], "label": r["label"], "score": round(r["score"], 3)}
            for h, r in zip(headlines, all_results)
        ],
    }


if __name__ == "__main__":
    test_headlines = [
        "Russia launches missile strikes on Kyiv infrastructure",
        "Iran nuclear talks collapse as IAEA inspectors expelled",
        "Taiwan Strait military exercises draw US Navy response",
        "Venezuela opposition leader arrested ahead of elections",
        "Ceasefire agreement signed between Ethiopia and rebels",
        "Pakistan military launches offensive in tribal regions",
        "Brazil economic growth exceeds forecasts at 3.2%",
        "Serbia moves troops near Kosovo border amid tensions",
    ]
    print("Running FinBERT sentiment on 8 test headlines...")
    out = analyze_headlines_sentiment(test_headlines)
    print("\n--- Aggregate (8 keys) ---")
    for k in [
        "finbert_negative_score",
        "finbert_positive_score",
        "finbert_neutral_score",
        "headline_volume",
        "headline_escalatory_pct",
        "media_negativity_index",
        "sentiment_trend_7d",
        "dominant_sentiment",
    ]:
        print(f"  {k}: {out[k]}")
    print("\n--- Individual results ---")
    for ir in out["individual_results"]:
        print(f"  {ir['headline'][:50]}... -> {ir['label']} ({ir['score']})")
    print("\n--- Empty list (neutral defaults) ---")
    empty = analyze_headlines_sentiment([])
    print(f"  dominant_sentiment: {empty['dominant_sentiment']}")
    print(f"  headline_volume: {empty['headline_volume']}")
