from flask import Blueprint, request, jsonify
from app.extensions import limiter
from app.services.singleflight import get_or_compute
from app.services.market_data import search_tickers, get_quote, get_history_by_range
from app.services.indicators_service import build_indicator_series
from app.services.sentiment_service import get_sentiment
from app.services.prediction_service import predict_stock_trend

stocks_bp = Blueprint("stocks", __name__)


@stocks_bp.get("/api/search")
@limiter.limit("30 per minute")
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
@limiter.limit("20 per minute")
def stock():
    ticker = request.args.get("ticker", "").upper().strip()
    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    cache_key = f"stock:{ticker}"

    try:
        payload = get_or_compute(
            cache_key=cache_key,
            ttl_seconds=30,
            compute_fn=lambda: get_quote(ticker),
        )
        return jsonify(payload)
    except Exception as e:
        print(f"/api/stock failed for {ticker}: {e}")
        return jsonify({"error": str(e)}), 500


@stocks_bp.get("/api/sentiment")
@limiter.limit("10 per minute")
def sentiment():
    ticker = request.args.get("ticker", "").upper().strip()
    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    cache_key = f"sentiment:{ticker}"

    try:
        def compute_sentiment():
            company_name = ""
            try:
                quote = get_quote(ticker)
                company_name = str(quote.get("name") or "").strip()
            except Exception:
                company_name = ""

            return get_sentiment(ticker, company_name=company_name)

        payload = get_or_compute(
            cache_key=cache_key,
            ttl_seconds=600,
            compute_fn=compute_sentiment,
        )
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
@limiter.limit("10 per minute")
def indicator_series():
    ticker = request.args.get("ticker", "").upper().strip()
    period = (request.args.get("period") or "6mo").strip()
    interval = (request.args.get("interval") or "1d").strip()

    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    cache_key = f"indicator_series:{ticker}:{period}:{interval}"

    try:
        payload = get_or_compute(
            cache_key=cache_key,
            ttl_seconds=300,
            compute_fn=lambda: build_indicator_series(ticker, period=period, interval=interval),
        )
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
@limiter.limit("15 per minute")
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
@limiter.limit("10 per minute")
def prediction():
    ticker = request.args.get("ticker", "").upper().strip()
    risk_profile = (request.args.get("risk") or "Moderate").strip()

    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    cache_key = f"prediction:{ticker}:{risk_profile}"

    try:
        payload = get_or_compute(
            cache_key=cache_key,
            ttl_seconds=1800,
            compute_fn=lambda: predict_stock_trend(ticker, risk_profile=risk_profile),
        )
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


@stocks_bp.get("/api/debug_tables")
@limiter.exempt
def debug_tables():
    from app.db import get_db
    db = get_db()
    rows = db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
    ).fetchall()
    return jsonify([r["name"] for r in rows])