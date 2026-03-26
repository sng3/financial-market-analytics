from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from app.db import get_db
import json

bp = Blueprint("auth", __name__, url_prefix="/api")


def row_to_user_dict(row):
    return {
        "id": row["id"],
        "firstName": row["first_name"],
        "lastName": row["last_name"],
        "email": row["email"],
        "phone": row["phone"] or "",
        "riskTolerance": row["risk_tolerance"],
        "experience": row["experience"],
        "goal": row["goal"],
        "horizon": row["horizon"],
        "favoriteSectors": json.loads(row["favorite_sectors"] or "[]"),
        "notifications": {
            "emailAlerts": bool(row["email_alerts"]),
            "priceAlerts": bool(row["price_alerts"]),
            "newsAlerts": bool(row["news_alerts"]),
            "earningsAlerts": bool(row["earnings_alerts"]),
        },
        "country": row["country"],
        "timeZone": row["time_zone"],
    }


@bp.post("/signup")
def signup():
    data = request.get_json() or {}

    first_name = str(data.get("firstName", "")).strip()
    last_name = str(data.get("lastName", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    phone = str(data.get("phone", "")).strip()
    password = str(data.get("password", "")).strip()

    if not first_name or not last_name or not email or not password:
        return jsonify({"error": "Missing required fields."}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400

    db = get_db()

    existing = db.execute(
        "SELECT id FROM users WHERE email = ?;",
        (email,)
    ).fetchone()

    if existing:
        return jsonify({"error": "An account with this email already exists."}), 409

    password_hash = generate_password_hash(password)

    cursor = db.execute(
        """
        INSERT INTO users (
            first_name, last_name, email, phone, password_hash
        )
        VALUES (?, ?, ?, ?, ?);
        """,
        (first_name, last_name, email, phone, password_hash)
    )
    db.commit()

    user_id = cursor.lastrowid

    user = db.execute(
        "SELECT * FROM users WHERE id = ?;",
        (user_id,)
    ).fetchone()

    return jsonify({
        "message": "Account created successfully.",
        "user": row_to_user_dict(user)
    }), 201


@bp.post("/login")
def login():
    data = request.get_json() or {}

    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", "")).strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    db = get_db()

    user = db.execute(
        "SELECT * FROM users WHERE email = ?;",
        (email,)
    ).fetchone()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password."}), 401

    return jsonify({
        "message": "Login successful.",
        "user": row_to_user_dict(user)
    }), 200


@bp.get("/profile/<int:user_id>")
def get_profile(user_id: int):
    db = get_db()

    user = db.execute(
        "SELECT * FROM users WHERE id = ?;",
        (user_id,)
    ).fetchone()

    if not user:
        return jsonify({"error": "User not found."}), 404

    return jsonify({"user": row_to_user_dict(user)}), 200


@bp.put("/profile/<int:user_id>")
def update_profile(user_id: int):
    data = request.get_json() or {}

    favorite_sectors = json.dumps(data.get("favoriteSectors", []))
    notifications = data.get("notifications", {})

    db = get_db()

    user = db.execute(
        "SELECT * FROM users WHERE id = ?;",
        (user_id,)
    ).fetchone()

    if not user:
        return jsonify({"error": "User not found."}), 404

    db.execute(
        """
        UPDATE users
        SET
            first_name = ?,
            last_name = ?,
            phone = ?,
            risk_tolerance = ?,
            experience = ?,
            goal = ?,
            horizon = ?,
            favorite_sectors = ?,
            email_alerts = ?,
            price_alerts = ?,
            news_alerts = ?,
            earnings_alerts = ?,
            country = ?,
            time_zone = ?
        WHERE id = ?;
        """,
        (
            str(data.get("firstName", user["first_name"])).strip(),
            str(data.get("lastName", user["last_name"])).strip(),
            str(data.get("phone", user["phone"] or "")).strip(),
            str(data.get("riskTolerance", user["risk_tolerance"])).strip(),
            str(data.get("experience", user["experience"])).strip(),
            str(data.get("goal", user["goal"])).strip(),
            str(data.get("horizon", user["horizon"])).strip(),
            favorite_sectors,
            1 if notifications.get("emailAlerts", bool(user["email_alerts"])) else 0,
            1 if notifications.get("priceAlerts", bool(user["price_alerts"])) else 0,
            1 if notifications.get("newsAlerts", bool(user["news_alerts"])) else 0,
            1 if notifications.get("earningsAlerts", bool(user["earnings_alerts"])) else 0,
            str(data.get("country", user["country"])).strip(),
            str(data.get("timeZone", user["time_zone"])).strip(),
            user_id,
        )
    )
    db.commit()

    updated_user = db.execute(
        "SELECT * FROM users WHERE id = ?;",
        (user_id,)
    ).fetchone()

    return jsonify({
        "message": "Profile updated successfully.",
        "user": row_to_user_dict(updated_user)
    }), 200