from flask import Blueprint, request, jsonify
from app.db import get_db
from app.services.alert_check_service import check_user_price_alerts

bp = Blueprint("alerts", __name__, url_prefix="/api")


def _row_to_alert(row):
    return {
        "id": str(row["id"]),
        "ticker": row["ticker"],
        "condition": row["condition"],
        "price": row["price"],
        "status": row["status"],
        "createdAt": row["created_at"],
    }


@bp.get("/users/<int:user_id>/alerts")
def list_alerts(user_id: int):
    db = get_db()

    user = db.execute(
        """
        SELECT
            id,
            email_alerts,
            price_alerts,
            news_alerts,
            sms_notifications,
            push_notifications
        FROM users
        WHERE id = ?;
        """,
        (user_id,),
    ).fetchone()

    if not user:
        return jsonify({"error": "User not found"}), 404

    rows = db.execute(
        """
        SELECT id, user_id, ticker, condition, price, status, created_at
        FROM alerts
        WHERE user_id = ?
        ORDER BY id DESC;
        """,
        (user_id,),
    ).fetchall()

    return jsonify({
        "notifications": {
            "emailAlerts": bool(user["email_alerts"]),
            "priceAlerts": bool(user["price_alerts"]),
            "newsAlerts": bool(user["news_alerts"]),
            "smsNotifications": bool(user["sms_notifications"]),
            "pushNotifications": bool(user["push_notifications"]),
        },
        "alerts": [_row_to_alert(r) for r in rows]
    }), 200


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

    user = db.execute(
        """
        SELECT
            id,
            price_alerts,
            email_alerts,
            sms_notifications,
            push_notifications
        FROM users
        WHERE id = ?;
        """,
        (user_id,),
    ).fetchone()

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not bool(user["price_alerts"]):
        return jsonify({
            "error": "Price alerts are disabled in your profile settings."
        }), 403

    has_delivery = (
        bool(user["email_alerts"]) or
        bool(user["sms_notifications"]) or
        bool(user["push_notifications"])
    )

    if not has_delivery:
        return jsonify({
            "error": "At least one delivery method must be enabled to create a price alert."
        }), 400

    cur = db.execute(
        """
        INSERT INTO alerts (user_id, ticker, condition, price, status)
        VALUES (?, ?, ?, ?, 'Active');
        """,
        (user_id, ticker, condition, price),
    )
    db.commit()

    row = db.execute(
        """
        SELECT id, user_id, ticker, condition, price, status, created_at
        FROM alerts
        WHERE id = ?;
        """,
        (cur.lastrowid,),
    ).fetchone()

    return jsonify({
        "ok": True,
        "alert": _row_to_alert(row)
    }), 201


@bp.post("/users/<int:user_id>/alerts/check")
def check_alerts(user_id: int):
    result = check_user_price_alerts(user_id)

    if not result.get("ok") and result.get("error") == "User not found":
        return jsonify({"error": "User not found"}), 404

    return jsonify(result), 200


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