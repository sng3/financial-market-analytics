from flask import Blueprint, request, jsonify
from app.services.cache import cache_get, cache_set
from app.services.market_data import search_tickers, get_quote, get_history_by_range
from app.services.indicators_service import build_indicator_series
from app.services.sentiment_service import get_sentiment
from app.services.prediction_service import predict_stock_trend

stocks_bp = Blueprint("stocks", __name__)

@stocks_bp.get("/api/search")
def search():
    q = request.args.get("q", "").strip()
    try:
        return jsonify(search_tickers(q))
    except Exception as e:
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
        payload = get_sentiment(ticker)
        cache_set(cache_key, payload, ttl_seconds=600)
        return jsonify(payload)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@stocks_bp.get("/api/indicator_series")
def indicator_series():
    ticker = request.args.get("ticker", "").upper().strip()
    period = (request.args.get("period") or "6mo").strip()
    interval = (request.args.get("interval") or "1d").strip()

    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    cache_key = f"indicator_series:{ticker}:{period}:{interval}"
    cached = cache_get(cache_key)
    if cached:
        return jsonify(cached)

    try:
        payload = build_indicator_series(ticker, period=period, interval=interval)
        cache_set(cache_key, payload, ttl_seconds=300)
        return jsonify(payload)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@stocks_bp.get("/api/history")
def history():
    ticker = request.args.get("ticker", "").upper().strip()
    range_value = (request.args.get("range") or "1Y").strip().upper()

    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    cache_key = f"history:{ticker}:{range_value}"
    cached = cache_get(cache_key)
    if cached:
        return jsonify(cached)

    try:
        payload = get_history_by_range(ticker, range_value)
        cache_set(cache_key, payload, ttl_seconds=300)
        return jsonify(payload)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to fetch history: {str(e)}"}), 500


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
        return jsonify({"error": str(e)}), 500


@stocks_bp.get("/api/debug_tables")
def debug_tables():
    from app.db import get_db
    db = get_db()
    rows = db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
    ).fetchall()
    return jsonify([r["name"] for r in rows])