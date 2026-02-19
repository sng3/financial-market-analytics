from flask import Blueprint, request, jsonify
from app.services.market_data import (
    get_quote,
    get_history,
    search_tickers,
    build_indicators_from_history,
)
from app.services.sentiment import get_sentiment


stocks_bp = Blueprint("stocks", __name__)

@stocks_bp.get("/api/health")
def health():
    return jsonify({"ok": True})

@stocks_bp.get("/api/stock")
def stock():
    ticker = request.args.get("ticker", "").upper().strip()
    if not ticker:
        return jsonify({"error": "ticker required"}), 400
    try:
        return jsonify(get_quote(ticker))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@stocks_bp.get("/api/search")
def search():
    q = request.args.get("q", "").strip()
    try:
        return jsonify(search_tickers(q))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@stocks_bp.get("/api/history")
def history():
    ticker = request.args.get("ticker", "").upper().strip()
    range_ = request.args.get("range", "1y").strip().lower()
    if not ticker:
        return jsonify({"error": "ticker required"}), 400

    range_map = {"1d": 1, "5d": 5, "1m": 30, "6m": 180, "1y": 365, "max": 1825}
    days = range_map.get(range_, 365)

    try:
        return jsonify(get_history(ticker, days))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@stocks_bp.get("/api/indicators")
def indicators():
    ticker = request.args.get("ticker", "").upper().strip()
    range_ = request.args.get("range", "1y").strip().lower()
    if not ticker:
        return jsonify({"error": "ticker required"}), 400

    range_map = {"1d": 1, "5d": 5, "1m": 30, "6m": 180, "1y": 365, "max": 1825}
    days = range_map.get(range_, 365)

    try:
        history = get_history(ticker, days)
        ind = build_indicators_from_history(history)

        sma20_last = next((x for x in reversed(ind["sma20"]) if x is not None), None)
        sma50_last = next((x for x in reversed(ind["sma50"]) if x is not None), None)

        return jsonify({
            "ticker": ticker,
            "range": range_,
            "days": days,
            "indicators": {
                "rsi14": ind["rsi14"],
                "sma20_last": sma20_last,
                "sma50_last": sma50_last,
            },
            "series": {
                "dates": ind["dates"],
                "close": ind["close"],
                "sma20": ind["sma20"],
                "sma50": ind["sma50"],
            },
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@stocks_bp.get("/api/sentiment")
def sentiment():
    ticker = request.args.get("ticker", "").upper().strip()
    if not ticker:
        return jsonify({"error": "ticker required"}), 400

    try:
        return jsonify(get_sentiment(ticker))
    except Exception as e:
        return jsonify({"error": str(e)}), 500
