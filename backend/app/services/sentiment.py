# backend/app/services/sentiment.py
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List
import hashlib


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _score_to_label(score: float) -> str:
    if score >= 0.2:
        return "positive"
    if score <= -0.2:
        return "negative"
    return "neutral"


def _stable_stub_score(ticker: str) -> float:
    h = hashlib.sha256(ticker.encode("utf-8")).hexdigest()
    x = int(h[:8], 16) / 0xFFFFFFFF
    return round((x * 2.0) - 1.0, 3)


def get_sentiment(ticker: str) -> Dict[str, Any]:
    ticker = (ticker or "").strip().upper()
    if not ticker:
        raise ValueError("ticker required")

    overall_score = _stable_stub_score(ticker)
    overall_label = _score_to_label(overall_score)

    topics: List[Dict[str, Any]] = [
        {"topic": "Earnings", "score": round(overall_score * 0.9, 3)},
        {"topic": "Guidance", "score": round(overall_score * 0.7, 3)},
        {"topic": "Macro", "score": round(overall_score * 0.5, 3)},
    ]
    for t in topics:
        t["label"] = _score_to_label(t["score"])

    headlines: List[Dict[str, Any]] = [
        {
            "title": f"{ticker} moves as traders react to latest news",
            "source": "StubWire",
            "score": round(overall_score * 0.8, 3),
        },
        {
            "title": f"Analyst commentary highlights {ticker} risk/reward",
            "source": "StubStreet",
            "score": round(overall_score * 0.6, 3),
        },
        {
            "title": f"{ticker} sector peers show mixed performance",
            "source": "StubFinance",
            "score": round(overall_score * 0.4, 3),
        },
    ]
    for h in headlines:
        h["label"] = _score_to_label(h["score"])

    return {
        "ticker": ticker,
        "updatedAt": _utc_now_iso(),
        "overall": {"label": overall_label, "score": overall_score},
        "topics": topics,
        "headlines": headlines,
    }
