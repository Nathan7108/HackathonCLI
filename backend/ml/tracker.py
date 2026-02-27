# Sentinel AI — PredictionTracker (SQLite logging)
# S3-01: log predictions, get track record, compute accuracy. See GitHub Issue #21.

import json
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


class PredictionTracker:
    """
    SQLite-based logging of all predictions for track-record and accuracy.
    """

    def __init__(self, db_path: str | None = None):
        if db_path is None:
            db_path = str(_repo_root() / "sentinel_predictions.db")
        self.db_path = db_path
        self._init_db()

    def _init_db(self) -> None:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS predictions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    country_code TEXT NOT NULL,
                    predicted_at TEXT NOT NULL,
                    risk_level TEXT NOT NULL,
                    risk_score INTEGER NOT NULL,
                    confidence REAL NOT NULL,
                    feature_snapshot TEXT,
                    model_version TEXT,
                    actual_risk_level TEXT,
                    prediction_correct INTEGER
                )
            """)
            conn.commit()

    def log_prediction(
        self,
        country_code: str,
        prediction: dict,
        features: dict,
        model_version: str = "2.0.0",
    ) -> None:
        """Insert one prediction into SQLite."""
        predicted_at = datetime.utcnow().isoformat() + "Z"
        risk_level = prediction.get("risk_level", "")
        risk_score = int(prediction.get("risk_score", 0))
        confidence = float(prediction.get("confidence", 0))
        feature_snapshot = json.dumps(features) if features else "{}"
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO predictions
                (country_code, predicted_at, risk_level, risk_score, confidence,
                 feature_snapshot, model_version, actual_risk_level, prediction_correct)
                VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)
                """,
                (country_code, predicted_at, risk_level, risk_score, confidence, feature_snapshot, model_version),
            )
            conn.commit()

    def get_track_record(self, limit: int = 20) -> list[dict]:
        """Return recent predictions for UI (newest first)."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cur = conn.execute(
                """
                SELECT country_code, predicted_at, risk_level, risk_score, confidence,
                       model_version, actual_risk_level, prediction_correct
                FROM predictions
                ORDER BY predicted_at DESC
                LIMIT ?
                """,
                (limit,),
            )
            rows = cur.fetchall()
        return [dict(row) for row in rows]

    def compute_accuracy(self, days_back: int = 90) -> dict:
        """Calculate accuracy metrics over the last N days (where prediction_correct is set)."""
        since = (datetime.utcnow() - timedelta(days=days_back)).isoformat() + "Z"
        with sqlite3.connect(self.db_path) as conn:
            cur = conn.execute(
                """
                SELECT prediction_correct FROM predictions
                WHERE predicted_at >= ? AND prediction_correct IS NOT NULL
                """,
                (since,),
            )
            rows = cur.fetchall()
        if not rows:
            return {
                "total_evaluated": 0,
                "correct": 0,
                "accuracy_pct": 0.0,
                "days_back": days_back,
            }
        total = len(rows)
        correct = sum(1 for (r,) in rows if r == 1)
        return {
            "total_evaluated": total,
            "correct": correct,
            "accuracy_pct": round(100.0 * correct / total, 1) if total else 0.0,
            "days_back": days_back,
        }
