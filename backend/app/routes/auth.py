from flask import Blueprint, request, jsonify
from app.db import get_db

bp = Blueprint("auth", __name__, url_prefix="/api")


def _row_to_user_profile(row):
    return {
        "id": row["id"],
        "firstName": row["first_name"] or "",
        "lastName": row["last_name"] or "",
        "email": row["email"] or "",
        "phone": row["phone"] or "",
        "riskTolerance": row["risk_tolerance"] or "Moderate",
        "experience": row["experience"] or "Beginner",
        "goal": row["goal"] or "Learning",
        "horizon": row["horizon"] or "1 - 5 Years",
        "favoriteSectors": [],
        "notifications": {
            "emailAlerts": bool(row["email_alerts"]),
            "priceAlerts": bool(row["price_alerts"]),
            "newsAlerts": bool(row["news_alerts"]),
            "earningsAlerts": bool(row["earnings_alerts"]),
        },
        "country": row["country"] or "United States",
        "timeZone": row["time_zone"] or "America/New_York",
    }


@bp.post("/signup")
def signup():
    data = request.get_json(silent=True) or {}

    first_name = (data.get("firstName") or "").strip()
    last_name = (data.get("lastName") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip()
    password = data.get("password") or ""

    if not first_name or not last_name or not email or not phone or not password:
        return jsonify({"error": "Missing required fields"}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    db = get_db()

    existing = db.execute(
        "SELECT id FROM users WHERE email = ?;",
        (email,)
    ).fetchone()

    if existing:
        return jsonify({"error": "An account with this email already exists"}), 409

    cur = db.execute("""
        INSERT INTO users (
            first_name,
            last_name,
            email,
            phone,
            password_hash
        ) VALUES (?, ?, ?, ?, ?);
    """, (
        first_name,
        last_name,
        email,
        phone,
        password
    ))

    user_id = cur.lastrowid

    db.execute(
        "INSERT INTO watchlists (user_id, name) VALUES (?, ?);",
        (user_id, "Main")
    )

    db.commit()

    row = db.execute(
        "SELECT * FROM users WHERE id = ?;",
        (user_id,)
    ).fetchone()

    return jsonify({
        "ok": True,
        "user": _row_to_user_profile(row)
    }), 201


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    db = get_db()
    row = db.execute(
        "SELECT * FROM users WHERE email = ?;",
        (email,)
    ).fetchone()

    if not row:
        return jsonify({"error": "Invalid email or password"}), 401

    if row["password_hash"] != password:
        return jsonify({"error": "Invalid email or password"}), 401

    user_id = row["id"]

    db.execute("""
        INSERT INTO watchlists (user_id, name)
        SELECT ?, 'Main'
        WHERE NOT EXISTS (
            SELECT 1 FROM watchlists WHERE user_id = ?
        );
    """, (user_id, user_id))
    db.commit()

    row = db.execute(
        "SELECT * FROM users WHERE id = ?;",
        (user_id,)
    ).fetchone()

    return jsonify({
        "ok": True,
        "user": _row_to_user_profile(row)
    }), 200


@bp.get("/profile/<int:user_id>")
def get_profile(user_id: int):
    db = get_db()
    row = db.execute(
        "SELECT * FROM users WHERE id = ?;",
        (user_id,)
    ).fetchone()

    if not row:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "ok": True,
        "user": _row_to_user_profile(row)
    }), 200


@bp.put("/profile/<int:user_id>")
def update_profile(user_id: int):
    data = request.get_json(silent=True) or {}
    db = get_db()

    existing = db.execute(
        "SELECT * FROM users WHERE id = ?;",
        (user_id,)
    ).fetchone()

    if not existing:
        return jsonify({"error": "User not found"}), 404

    favorite_sectors = data.get("favoriteSectors") or []
    notifications = data.get("notifications") or {}

    db.execute("""
        UPDATE users
        SET
            first_name = ?,
            last_name = ?,
            email = ?,
            phone = ?,
            risk_tolerance = ?,
            experience = ?,
            goal = ?,
            horizon = ?,
            country = ?,
            time_zone = ?,
            email_alerts = ?,
            price_alerts = ?,
            news_alerts = ?,
            earnings_alerts = ?
        WHERE id = ?;
    """, (
        (data.get("firstName") or "").strip(),
        (data.get("lastName") or "").strip(),
        (data.get("email") or "").strip().lower(),
        (data.get("phone") or "").strip(),
        data.get("riskTolerance") or "Moderate",
        data.get("experience") or "Beginner",
        data.get("goal") or "Learning",
        data.get("horizon") or "1 - 5 Years",
        data.get("country") or "United States",
        data.get("timeZone") or "America/New_York",
        1 if notifications.get("emailAlerts", True) else 0,
        1 if notifications.get("priceAlerts", True) else 0,
        1 if notifications.get("newsAlerts", True) else 0,
        1 if notifications.get("earningsAlerts", False) else 0,
        user_id
    ))

    db.commit()

    row = db.execute(
        "SELECT * FROM users WHERE id = ?;",
        (user_id,)
    ).fetchone()

    return jsonify({
        "ok": True,
        "user": _row_to_user_profile(row)
    }), 200


@bp.delete("/profile/<int:user_id>")
def delete_profile(user_id: int):
    db = get_db()

    existing = db.execute(
        "SELECT id FROM users WHERE id = ?;",
        (user_id,)
    ).fetchone()

    if not existing:
        return jsonify({"error": "User not found"}), 404

    cur = db.execute(
        "DELETE FROM users WHERE id = ?;",
        (user_id,)
    )
    db.commit()

    return jsonify({
        "ok": True,
        "deleted": cur.rowcount,
        "user_id": user_id
    }), 200