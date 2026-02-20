from flask import Blueprint, request, jsonify
from app.db import get_db

bp = Blueprint("watchlists", __name__, url_prefix="/api")

@bp.get("/users/<int:user_id>/watchlists")
def list_watchlists(user_id: int):
    db = get_db()
    rows = db.execute(
        "SELECT id, user_id, name FROM watchlists WHERE user_id = ? ORDER BY id DESC;",
        (user_id,),
    ).fetchall()
    return jsonify({"watchlists": [dict(r) for r in rows]})

@bp.get("/watchlists/<int:watchlist_id>/tickers")
def list_tickers(watchlist_id: int):
    db = get_db()
    rows = db.execute(
        "SELECT ticker FROM watchlist_items WHERE watchlist_id = ? ORDER BY ticker ASC;",
        (watchlist_id,),
    ).fetchall()
    return jsonify({"watchlist_id": watchlist_id, "tickers": [r["ticker"] for r in rows]})

@bp.post("/watchlists/<int:watchlist_id>/tickers")
def add_ticker(watchlist_id: int):
    data = request.get_json(silent=True) or {}
    ticker = (data.get("ticker") or "").strip().upper()
    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    db = get_db()
    db.execute(
        "INSERT OR IGNORE INTO watchlist_items (watchlist_id, ticker) VALUES (?, ?);",
        (watchlist_id, ticker),
    )
    db.commit()

    return jsonify({"ok": True, "watchlist_id": watchlist_id, "ticker": ticker}), 201

@bp.delete("/watchlists/<int:watchlist_id>/tickers/<string:ticker>")
def delete_ticker(watchlist_id: int, ticker: str):
    ticker = (ticker or "").strip().upper()
    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    db = get_db()
    cur = db.execute(
        "DELETE FROM watchlist_items WHERE watchlist_id = ? AND ticker = ?;",
        (watchlist_id, ticker),
    )
    db.commit()

    return jsonify({
        "ok": True,
        "watchlist_id": watchlist_id,
        "ticker": ticker,
        "deleted": cur.rowcount
    }), 200