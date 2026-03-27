from flask import Blueprint, request, jsonify
from app.db import get_db

bp = Blueprint("alerts", __name__, url_prefix="/api")


@bp.get("/users/<int:user_id>/alerts")
def list_alerts(user_id: int):
    db = get_db()
    rows = db.execute("""
        SELECT id, user_id, ticker, condition, price, status, created_at
        FROM alerts
        WHERE user_id = ?
        ORDER BY id DESC;
    """, (user_id,)).fetchall()

    return jsonify({
        "alerts": [
            {
                "id": str(r["id"]),
                "ticker": r["ticker"],
                "condition": r["condition"],
                "price": r["price"],
                "status": r["status"],
                "createdAt": r["created_at"],
            }
            for r in rows
        ]
    })


@bp.post("/users/<int:user_id>/alerts")
def create_alert(user_id: int):
    data = request.get_json(silent=True) or {}

    ticker = (data.get("ticker") or "").strip().upper()
    condition = (data.get("condition") or "").strip()
    price = data.get("price")

    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    if condition not in ("Above", "Below"):
        return jsonify({"error": "condition must be Above or Below"}), 400

    try:
        price = float(price)
    except Exception:
        return jsonify({"error": "price must be a valid number"}), 400

    db = get_db()
    cur = db.execute("""
        INSERT INTO alerts (user_id, ticker, condition, price, status)
        VALUES (?, ?, ?, ?, 'Active');
    """, (user_id, ticker, condition, price))
    db.commit()

    row = db.execute("""
        SELECT id, user_id, ticker, condition, price, status, created_at
        FROM alerts
        WHERE id = ?;
    """, (cur.lastrowid,)).fetchone()

    return jsonify({
        "ok": True,
        "alert": {
            "id": str(row["id"]),
            "ticker": row["ticker"],
            "condition": row["condition"],
            "price": row["price"],
            "status": row["status"],
            "createdAt": row["created_at"],
        }
    }), 201


@bp.delete("/alerts/<int:alert_id>")
def delete_alert(alert_id: int):
    db = get_db()
    cur = db.execute("DELETE FROM alerts WHERE id = ?;", (alert_id,))
    db.commit()

    if cur.rowcount == 0:
        return jsonify({"error": "Alert not found"}), 404

    return jsonify({
        "ok": True,
        "deleted": cur.rowcount,
        "id": str(alert_id),
    }), 200