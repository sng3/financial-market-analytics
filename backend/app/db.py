import sqlite3
from flask import g

DB_PATH = "app.db"


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON;")
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

    

    # DEV seed (safe: uses INSERT OR IGNORE)
    db.execute("INSERT OR IGNORE INTO users (id, email) VALUES (?, ?);", (1, "will@utoledo.edu"))
    db.execute("INSERT OR IGNORE INTO watchlists (id, user_id, name) VALUES (?, ?, ?);", (1, 1, "Main"))
    db.commit()

