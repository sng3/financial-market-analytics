from flask import Blueprint, request, jsonify
from app.services.market_data import get_quote, get_history

bp = Blueprint("stocks", __name__, url_prefix="/api/stocks")

@bp.get("/quote")
def quote():
    ticker = (request.args.get("ticker") or "").strip().upper()
    if not ticker:
        return jsonify({"error": "ticker is required"}), 400
    return jsonify(get_quote(ticker))

@bp.get("/history")
def history():
    ticker = (request.args.get("ticker") or "").strip().upper()
    days = int(request.args.get("days", 30))

    if not ticker:
        return jsonify({"error": "ticker is required"}), 400
    if days < 1 or days > 365:
        return jsonify({"error": "days must be between 1 and 365"}), 400

    return jsonify(get_history(ticker, days))
