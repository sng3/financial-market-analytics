from flask import Blueprint, request, jsonify
from app.services.cache import cache_get, cache_set
from app.services.market_data import search_tickers, get_quote
from app.services.indicators_service import build_indicator_series
from app.services.sentiment_service import get_sentiment

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

@stocks_bp.get("/api/debug_tables")
def debug_tables():
    from app.db import get_db
    db = get_db()
    rows = db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;").fetchall()
    return jsonify([r["name"] for r in rows])