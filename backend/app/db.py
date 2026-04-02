import sqlite3
from flask import g

DB_PATH = "app.db"


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH, timeout=10)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON;")
        g.db.execute("PRAGMA journal_mode = WAL;")
        g.db.execute("PRAGMA synchronous = NORMAL;")
    return g.db


def close_db(_=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def _ensure_column(db, table_name: str, column_name: str, column_sql: str):
    columns = db.execute(f"PRAGMA table_info({table_name});").fetchall()
    existing = {col["name"] for col in columns}
    if column_name not in existing:
        db.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_sql};")


def init_db():
    db = get_db()

    db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL DEFAULT '',
            last_name TEXT NOT NULL DEFAULT '',
            email TEXT UNIQUE NOT NULL,
            phone TEXT DEFAULT '',
            password_hash TEXT NOT NULL DEFAULT '',
            risk_tolerance TEXT NOT NULL DEFAULT 'Moderate',
            experience TEXT NOT NULL DEFAULT 'Beginner',
            goal TEXT NOT NULL DEFAULT 'Learning',
            horizon TEXT NOT NULL DEFAULT '1 - 5 Years',
            favorite_sectors TEXT NOT NULL DEFAULT '[]',
            email_alerts INTEGER NOT NULL DEFAULT 1,
            price_alerts INTEGER NOT NULL DEFAULT 1,
            news_alerts INTEGER NOT NULL DEFAULT 1,
            earnings_alerts INTEGER NOT NULL DEFAULT 0,
            sms_notifications INTEGER NOT NULL DEFAULT 0,
            push_notifications INTEGER NOT NULL DEFAULT 0,
            country TEXT NOT NULL DEFAULT 'United States',
            time_zone TEXT NOT NULL DEFAULT 'America/New_York',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS watchlists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS watchlist_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            watchlist_id INTEGER NOT NULL,
            ticker TEXT NOT NULL,
            UNIQUE(watchlist_id, ticker),
            FOREIGN KEY(watchlist_id) REFERENCES watchlists(id) ON DELETE CASCADE
        );
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ticker TEXT NOT NULL,
            condition TEXT NOT NULL,
            price REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            triggered_at TIMESTAMP,
            last_checked_at TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS cache (
            cache_key TEXT PRIMARY KEY,
            payload_json TEXT NOT NULL,
            updated_at INTEGER NOT NULL,
            ttl_seconds INTEGER NOT NULL
        );
    """)

    _ensure_column(
        db,
        "alerts",
        "triggered_at",
        "triggered_at TIMESTAMP"
    )
    _ensure_column(
        db,
        "alerts",
        "last_checked_at",
        "last_checked_at TIMESTAMP"
    )

    db.execute("""
        INSERT INTO watchlists (user_id, name)
        SELECT u.id, 'Main'
        FROM users u
        WHERE NOT EXISTS (
            SELECT 1
            FROM watchlists w
            WHERE w.user_id = u.id
        );
    """)

    db.commit()