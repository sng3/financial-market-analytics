from flask import Blueprint, request, jsonify
from app.services.market_data import get_quote, get_history, search_tickers

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
        data = get_quote(ticker)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@stocks_bp.get("/api/search")
def search():
    q = request.args.get("q", "").strip()
    try:
        results = search_tickers(q)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@stocks_bp.get("/api/history")
def history():
    ticker = request.args.get("ticker", "").upper().strip()
    range_ = request.args.get("range", "1y")

    if not ticker:
        return jsonify({"error": "ticker required"}), 400

    # Map frontend ranges to days
    range_map = {
        "1d": 1,
        "5d": 5,
        "1m": 30,
        "6m": 180,
        "1y": 365,
        "max": 1825
    }

    days = range_map.get(range_.lower(), 365)

    try:
        data = get_history(ticker, days)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500



