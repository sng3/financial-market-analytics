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

def init_db():
    db = get_db()

    db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL
        );
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS watchlists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    """)

    db.execute("""
        CREATE TABLE IF NOT EXISTS watchlist_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            watchlist_id INTEGER NOT NULL,
            ticker TEXT NOT NULL,
            UNIQUE(watchlist_id, ticker),
            FOREIGN KEY(watchlist_id) REFERENCES watchlists(id)
        );
    """)

    # Cache table (from your big file)
    db.execute("""
        CREATE TABLE IF NOT EXISTS cache (
            cache_key TEXT PRIMARY KEY,
            payload_json TEXT NOT NULL,
            updated_at INTEGER NOT NULL,
            ttl_seconds INTEGER NOT NULL
        );
    """)

    # FK-safe seed (no hardcoded IDs)
    db.execute("INSERT OR IGNORE INTO users (email) VALUES (?);", ("will@utoledo.edu",))
    user_row = db.execute("SELECT id FROM users WHERE email = ?;", ("will@utoledo.edu",)).fetchone()
    if user_row:
        db.execute(
            "INSERT OR IGNORE INTO watchlists (user_id, name) VALUES (?, ?);",
            (user_row["id"], "Main")
        )

    db.commit()