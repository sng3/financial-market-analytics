import json
import math

from flask import Blueprint, request, jsonify

from app.db import get_db
from app.services.cache import cache_get, cache_set
from app.services.market_data import search_tickers, get_quote, get_history_by_range
from app.services.indicators_service import build_indicator_series
from app.services.sentiment_service import get_sentiment
from app.services.prediction_service import predict_stock_trend

stocks_bp = Blueprint("stocks", __name__)

# Broader candidate universe by sector.
# This is not the final recommendation list.
# It is only the pool the ranking engine evaluates dynamically.
SECTOR_UNIVERSE = {
    "Technology": [
        "AAPL", "MSFT", "NVDA", "AMD", "GOOGL", "META", "ADBE", "CRM", "QCOM", "INTU"
    ],
    "Healthcare": [
        "JNJ", "PFE", "MRK", "ABBV", "LLY", "TMO", "ISRG", "VRTX", "REGN", "BMY"
    ],
    "Energy": [
        "XOM", "CVX", "COP", "SLB", "EOG", "OXY", "HAL", "KMI", "OKE", "WMB"
    ],
    "Finance": [
        "JPM", "BAC", "GS", "MS", "WFC", "BLK", "SCHW", "USB", "TFC", "SPGI"
    ],
    "Consumer": [
        "AMZN", "COST", "WMT", "HD", "NKE", "PG", "KO", "PEP", "MCD", "SBUX"
    ],
    "Industrial": [
        "CAT", "BA", "GE", "HON", "UNP", "DE", "ETN", "PH", "MMM", "LMT"
    ],
    "Real Estate": [
        "PLD", "AMT", "O", "SPG", "CCI", "EQIX", "DLR", "VICI", "WELL", "AVB"
    ],
}

GOAL_PREFERENCE_HINTS = {
    "Learning": (
        "These stocks are selected by combining your preferred sectors with market trend, sentiment, "
        "and AI prediction signals so you can explore how different indicators support stock selection."
    ),
    "Long Term Growth": (
        "These stocks are ranked to favor stronger trend quality, positive sentiment, and growth-oriented setups."
    ),
    "Income": (
        "These stocks are ranked to favor more stable profiles with lower volatility and steadier signals."
    ),
    "Short Term Trading": (
        "These stocks are ranked to favor stronger short-term momentum, sentiment shifts, and prediction confidence."
    ),
}


@stocks_bp.get("/api/search")
def search():
    q = request.args.get("q", "").strip()

    if not q:
        return jsonify([])

    try:
        return jsonify(search_tickers(q))
    except Exception as e:
        print(f"/api/search failed: {e}")
        return jsonify({"error": str(e)}), 500


@stocks_bp.get("/api/stock")
def stock():
    ticker = request.args.get("ticker", "").upper().strip()
    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    cache_key = f"stock:{ticker}"
    cached = cache_get(cache_key)
    if cached:
        return jsonify(cached)

    try:
        payload = get_quote(ticker)
        cache_set(cache_key, payload, ttl_seconds=30)
        return jsonify(payload)
    except Exception as e:
        print(f"/api/stock failed for {ticker}: {e}")
        return jsonify({"error": str(e)}), 500


@stocks_bp.get("/api/sentiment")
def sentiment():
    ticker = request.args.get("ticker", "").upper().strip()
    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    cache_key = f"sentiment:{ticker}"
    cached = cache_get(cache_key)
    if cached:
        return jsonify(cached)

    try:
        company_name = ""
        try:
            quote = get_quote(ticker)
            company_name = str(quote.get("name") or "").strip()
        except Exception:
            company_name = ""

        payload = get_sentiment(ticker, company_name=company_name)

        if payload.get("items"):
            cache_set(cache_key, payload, ttl_seconds=600)

        return jsonify(payload)
    except Exception as e:
        print(f"/api/sentiment failed for {ticker}: {e}")
        return jsonify({
            "ticker": ticker,
            "label": "Neutral",
            "score": 0.0,
            "confidence": 0.0,
            "updatedAt": "",
            "items": [],
            "health": {
                "provider": "none",
                "status": "error",
                "warning": str(e),
                "sourceUsed": "none",
            },
        })


@stocks_bp.get("/api/indicator_series")
def indicator_series():
    ticker = request.args.get("ticker", "").upper().strip()
    period = (request.args.get("period") or "6mo").strip()
    interval = (request.args.get("interval") or "1d").strip()

    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    cache_key = f"indicator_series:{ticker}:{period}:{interval}"

    try:
        cached = cache_get(cache_key)
        if cached:
            return jsonify(cached)
    except Exception as e:
        print("⚠️ Cache read failed:", e)

    try:
        payload = build_indicator_series(ticker, period=period, interval=interval)

        try:
            cache_set(cache_key, payload, ttl_seconds=300)
        except Exception as e:
            print("⚠️ Cache write failed:", e)

        return jsonify(payload)

    except Exception as e:
        print(f"Indicator route failed for {ticker}: {e}")
        return jsonify({
            "ticker": ticker,
            "period": period,
            "interval": interval,
            "timestamps": [],
            "close": [],
            "sma20": [],
            "sma50": [],
            "rsi14": [],
            "updatedAt": 0,
        })


@stocks_bp.get("/api/history")
def history():
    ticker = request.args.get("ticker", "").upper().strip()
    range_value = request.args.get("range", "1Y")

    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    try:
        data = get_history_by_range(ticker, range_value)
        return jsonify(data)
    except Exception as e:
        print("ROUTE ERROR:", str(e))
        return jsonify({
            "ticker": ticker,
            "range": range_value,
            "series": []
        })


@stocks_bp.get("/api/prediction")
def prediction():
    ticker = request.args.get("ticker", "").upper().strip()
    risk_profile = (request.args.get("risk") or "Moderate").strip()

    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    cache_key = f"prediction:{ticker}:{risk_profile}"
    cached = cache_get(cache_key)
    if cached:
        return jsonify(cached)

    try:
        payload = predict_stock_trend(ticker, risk_profile=risk_profile)
        cache_set(cache_key, payload, ttl_seconds=1800)
        return jsonify(payload)
    except Exception as e:
        print(f"/api/prediction failed for {ticker}: {e}")
        return jsonify({
            "ticker": ticker,
            "horizon": "7-day",
            "trend": "Stable",
            "confidence": 0.0,
            "featuresUsed": [],
            "sentimentScore": 0.0,
            "sentimentLabel": "Neutral",
            "explanation": "Prediction is temporarily unavailable for this ticker.",
            "interpretation": "The model could not generate a reliable forecast with the currently available data.",
            "suggestedAction": "Watchlist",
            "actionReason": "Please review the stock manually until enough valid data is available.",
            "riskMessage": "Prediction is unavailable, so decisions should not rely on this signal alone.",
        })


def _normalize_favorite_sectors(raw_value):
    if not raw_value:
        return []

    try:
        parsed = json.loads(raw_value)
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []


def _safe_float(value, default=0.0):
    try:
        if value is None:
            return default
        return float(value)
    except Exception:
        return default


def _clamp(value, low, high):
    return max(low, min(high, value))


def _dedupe_preserve_order(values):
    seen = set()
    out = []

    for value in values:
        if value not in seen:
            seen.add(value)
            out.append(value)

    return out


def _goal_bucket(goal: str) -> str:
    goal = (goal or "").strip()

    if goal == "Long Term Growth":
        return "growth"
    if goal == "Income":
        return "income"
    if goal == "Short Term Trading":
        return "trading"
    return "balanced"


def _risk_bucket(risk_tolerance: str) -> str:
    risk_tolerance = (risk_tolerance or "").strip()

    if risk_tolerance == "Conservative":
        return "conservative"
    if risk_tolerance == "Aggressive":
        return "aggressive"
    return "moderate"


def _candidate_limit(risk_tolerance: str) -> int:
    bucket = _risk_bucket(risk_tolerance)

    if bucket == "conservative":
        return 6
    if bucket == "aggressive":
        return 10
    return 8


def _output_limit(risk_tolerance: str) -> int:
    bucket = _risk_bucket(risk_tolerance)

    if bucket == "conservative":
        return 3
    if bucket == "aggressive":
        return 5
    return 4


def _history_range_for_horizon(horizon: str) -> str:
    horizon = (horizon or "").strip()

    if horizon == "< 1 Year":
        return "6M"
    if horizon == "5+ Years":
        return "1Y"
    return "1Y"


def _fetch_cached_quote(ticker: str):
    cache_key = f"recommendation:quote:{ticker}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    payload = get_quote(ticker)
    cache_set(cache_key, payload, ttl_seconds=120)
    return payload


def _fetch_cached_sentiment(ticker: str):
    cache_key = f"recommendation:sentiment:{ticker}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    payload = get_sentiment(ticker)
    cache_set(cache_key, payload, ttl_seconds=900)
    return payload


def _fetch_cached_prediction(ticker: str, risk_tolerance: str):
    cache_key = f"recommendation:prediction:{ticker}:{risk_tolerance}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    payload = predict_stock_trend(ticker, risk_profile=risk_tolerance)
    cache_set(cache_key, payload, ttl_seconds=1800)
    return payload


def _fetch_cached_history(ticker: str, range_value: str):
    cache_key = f"recommendation:history:{ticker}:{range_value}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    payload = get_history_by_range(ticker, range_value)
    cache_set(cache_key, payload, ttl_seconds=900)
    return payload


def _compute_return_pct(series, lookback_points: int):
    if not series or len(series) < lookback_points:
        return 0.0

    recent = series[-lookback_points:]
    start_value = _safe_float(recent[0].get("v"), 0.0)
    end_value = _safe_float(recent[-1].get("v"), 0.0)

    if start_value <= 0:
        return 0.0

    return ((end_value - start_value) / start_value) * 100.0


def _compute_volatility_pct(series):
    if not series or len(series) < 10:
        return 0.0

    closes = [_safe_float(point.get("v"), 0.0) for point in series if point.get("v") is not None]

    if len(closes) < 10:
        return 0.0

    returns = []
    for index in range(1, len(closes)):
        prev_value = closes[index - 1]
        curr_value = closes[index]

        if prev_value > 0:
            returns.append((curr_value - prev_value) / prev_value)

    if len(returns) < 5:
        return 0.0

    mean_value = sum(returns) / len(returns)
    variance = sum((r - mean_value) ** 2 for r in returns) / len(returns)
    std_dev = math.sqrt(variance)

    return std_dev * 100.0


def _trend_strength_score(prediction_trend: str, prediction_confidence: float):
    trend = (prediction_trend or "Stable").strip()
    confidence = _safe_float(prediction_confidence, 0.0)

    if trend == "Up":
        return confidence / 100.0
    if trend == "Down":
        return -(confidence / 100.0)
    return 0.0


def _build_reason(goal: str, risk_tolerance: str, sector: str, features: dict) -> str:
    trend = features.get("predictionTrend", "Stable")
    sentiment_label = features.get("sentimentLabel", "Neutral")
    confidence = round(_safe_float(features.get("predictionConfidence"), 0.0))
    volatility = _safe_float(features.get("volatilityPct"), 0.0)

    if goal == "Long Term Growth":
        return (
            f"Selected for {sector} because it shows a {trend.lower()} AI trend, "
            f"{sentiment_label.lower()} sentiment, and growth-style momentum."
        )

    if goal == "Income":
        return (
            f"Selected for {sector} because it better fits a steadier profile with "
            f"lower-volatility preference and a {sentiment_label.lower()} sentiment backdrop."
        )

    if goal == "Short Term Trading":
        return (
            f"Selected for {sector} because it has stronger short-term activity, "
            f"{confidence}% prediction confidence, and trading-oriented momentum."
        )

    if risk_tolerance == "Conservative":
        return (
            f"Selected for {sector} because it appears more stable for a conservative profile "
            f"with about {volatility:.2f}% recent volatility."
        )

    return f"Selected dynamically from your preferred sector: {sector}."


def _score_stock_for_user(user_profile: dict, features: dict) -> float:
    goal = user_profile["goal"]
    risk_tolerance = user_profile["riskTolerance"]

    momentum_1m = _safe_float(features.get("return1mPct"), 0.0)
    momentum_3m = _safe_float(features.get("return3mPct"), 0.0)
    volatility = _safe_float(features.get("volatilityPct"), 0.0)
    sentiment_score = _safe_float(features.get("sentimentScore"), 0.0)
    prediction_confidence = _safe_float(features.get("predictionConfidence"), 0.0)
    trend_strength = _safe_float(features.get("trendStrength"), 0.0)

    score = 0.0

    # Goal weighting
    if goal == "Long Term Growth":
        score += momentum_3m * 0.40
        score += momentum_1m * 0.15
        score += sentiment_score * 20.0
        score += prediction_confidence * 0.25
        score += trend_strength * 18.0
        score -= volatility * 0.12

    elif goal == "Income":
        score += momentum_3m * 0.18
        score += sentiment_score * 10.0
        score += prediction_confidence * 0.18
        score += trend_strength * 8.0
        score -= volatility * 0.35

    elif goal == "Short Term Trading":
        score += momentum_1m * 0.45
        score += momentum_3m * 0.12
        score += sentiment_score * 24.0
        score += prediction_confidence * 0.32
        score += trend_strength * 24.0
        score += volatility * 0.08

    else:  # Learning / balanced
        score += momentum_3m * 0.25
        score += momentum_1m * 0.20
        score += sentiment_score * 16.0
        score += prediction_confidence * 0.22
        score += trend_strength * 14.0
        score -= volatility * 0.18

    # Risk tolerance adjustment
    if risk_tolerance == "Conservative":
        score -= volatility * 0.30
        score += max(momentum_3m, 0.0) * 0.10

    elif risk_tolerance == "Moderate":
        score -= volatility * 0.10
        score += max(momentum_3m, 0.0) * 0.08

    elif risk_tolerance == "Aggressive":
        score += volatility * 0.14
        score += max(momentum_1m, 0.0) * 0.12
        score += prediction_confidence * 0.05

    return round(score, 4)


def _build_candidate_list(favorite_sectors, goal: str, risk_tolerance: str):
    goal_bucket = _goal_bucket(goal)
    candidate_limit = _candidate_limit(risk_tolerance)

    tickers = []

    for sector in favorite_sectors:
        sector_candidates = SECTOR_UNIVERSE.get(sector, [])
        tickers.extend(sector_candidates[:candidate_limit])

    if not tickers:
        # fallback to a broad mixed set if no sectors were selected
        tickers.extend(SECTOR_UNIVERSE["Technology"][:4])
        tickers.extend(SECTOR_UNIVERSE["Healthcare"][:4])
        tickers.extend(SECTOR_UNIVERSE["Finance"][:4])

    tickers = _dedupe_preserve_order(tickers)

    # Slightly reorder candidates by goal style so each goal starts from a different bias.
    if goal_bucket == "income":
        preferred_front = ["JNJ", "PFE", "MRK", "ABBV", "JPM", "PG", "KO", "XOM", "CVX", "O"]
    elif goal_bucket == "trading":
        preferred_front = ["NVDA", "AMD", "META", "TSLA", "PLTR", "MRNA", "SLB", "GS", "BA", "GE"]
    elif goal_bucket == "growth":
        preferred_front = ["NVDA", "MSFT", "GOOGL", "LLY", "ISRG", "VRTX", "AMZN", "TMO", "BLK", "PLD"]
    else:
        preferred_front = ["AAPL", "MSFT", "JNJ", "JPM", "WMT", "CAT", "PLD"]

    ordered = []
    used = set()

    for ticker in preferred_front:
        if ticker in tickers and ticker not in used:
            used.add(ticker)
            ordered.append(ticker)

    for ticker in tickers:
        if ticker not in used:
            used.add(ticker)
            ordered.append(ticker)

    return ordered[:12]


@stocks_bp.get("/api/recommendations/<int:user_id>")
def recommendations(user_id: int):
    db = get_db()

    row = db.execute("""
        SELECT
            id,
            risk_tolerance,
            experience,
            goal,
            horizon,
            favorite_sectors
        FROM users
        WHERE id = ?;
    """, (user_id,)).fetchone()

    if not row:
        return jsonify({"error": "User not found"}), 404

    favorite_sectors = _normalize_favorite_sectors(row["favorite_sectors"])
    goal = row["goal"] or "Learning"
    risk_tolerance = row["risk_tolerance"] or "Moderate"
    experience = row["experience"] or "Beginner"
    horizon = row["horizon"] or "1 - 5 Years"

    user_profile = {
        "riskTolerance": risk_tolerance,
        "goal": goal,
        "horizon": horizon,
        "experience": experience,
        "favoriteSectors": favorite_sectors,
    }

    history_range = _history_range_for_horizon(horizon)
    candidate_tickers = _build_candidate_list(
        favorite_sectors=favorite_sectors,
        goal=goal,
        risk_tolerance=risk_tolerance,
    )

    ranked_items = []

    for ticker in candidate_tickers:
        sector = "General"
        for sector_name, sector_tickers in SECTOR_UNIVERSE.items():
            if ticker in sector_tickers:
                sector = sector_name
                break

        try:
            quote = _fetch_cached_quote(ticker)
        except Exception as e:
            print(f"Recommendation quote fetch failed for {ticker}: {e}")
            continue

        try:
            history_payload = _fetch_cached_history(ticker, history_range)
            history_series = history_payload.get("series", []) if history_payload else []
        except Exception as e:
            print(f"Recommendation history fetch failed for {ticker}: {e}")
            history_series = []

        try:
            sentiment_payload = _fetch_cached_sentiment(ticker)
        except Exception as e:
            print(f"Recommendation sentiment fetch failed for {ticker}: {e}")
            sentiment_payload = {
                "score": 0.0,
                "label": "Neutral",
                "confidence": 0.0,
            }

        try:
            prediction_payload = _fetch_cached_prediction(ticker, risk_tolerance)
        except Exception as e:
            print(f"Recommendation prediction fetch failed for {ticker}: {e}")
            prediction_payload = {
                "trend": "Stable",
                "confidence": 0.0,
            }

        return_1m = _compute_return_pct(history_series, 22)
        return_3m = _compute_return_pct(history_series, min(66, len(history_series))) if history_series else 0.0
        volatility_pct = _compute_volatility_pct(history_series)

        prediction_trend = prediction_payload.get("trend", "Stable")
        prediction_confidence = _safe_float(prediction_payload.get("confidence"), 0.0)
        sentiment_score = _safe_float(sentiment_payload.get("score"), 0.0)
        sentiment_label = sentiment_payload.get("label", "Neutral")

        features = {
            "return1mPct": return_1m,
            "return3mPct": return_3m,
            "volatilityPct": volatility_pct,
            "sentimentScore": sentiment_score,
            "sentimentLabel": sentiment_label,
            "predictionTrend": prediction_trend,
            "predictionConfidence": prediction_confidence,
            "trendStrength": _trend_strength_score(prediction_trend, prediction_confidence),
        }

        recommendation_score = _score_stock_for_user(user_profile, features)

        ranked_items.append({
            "ticker": ticker,
            "name": quote.get("name", ticker),
            "sector": sector,
            "price": quote.get("price"),
            "changePct": quote.get("changePct"),
            "reason": _build_reason(goal, risk_tolerance, sector, features),
            "score": recommendation_score,
            "features": features,
        })

    ranked_items.sort(key=lambda item: item.get("score", 0.0), reverse=True)

    # -----------------------------
    # Dynamic threshold (VERY IMPORTANT)
    # -----------------------------
    risk_bucket = _risk_bucket(risk_tolerance)

    if risk_bucket == "conservative":
        min_score = 12.0
    elif risk_bucket == "moderate":
        min_score = 8.0
    else:  # aggressive
        min_score = 5.0

    filtered_items = [
        item for item in ranked_items
        if item.get("score", 0.0) >= min_score
    ]

    # fallback if too strict (avoid empty UI)
    if len(filtered_items) < 2:
        filtered_items = ranked_items[:_output_limit(risk_tolerance)]

    final_items = filtered_items[:_output_limit(risk_tolerance)]

    return jsonify({
        "userId": user_id,
        "riskTolerance": risk_tolerance,
        "experience": experience,
        "goal": goal,
        "horizon": horizon,
        "favoriteSectors": favorite_sectors,
        "summary": GOAL_PREFERENCE_HINTS.get(
            goal,
            "These stocks are selected based on your saved investor preferences, market trend, and sentiment."
        ),
        "items": final_items,
    })


@stocks_bp.get("/api/debug_tables")
def debug_tables():
    db = get_db()
    rows = db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
    ).fetchall()
    return jsonify([r["name"] for r in rows])