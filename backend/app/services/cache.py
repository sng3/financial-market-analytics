import json
import time
from app.db import get_db


def cache_get(cache_key: str):
    db = get_db()
    now = int(time.time())

    row = db.execute(
        "SELECT payload_json, updated_at, ttl_seconds FROM cache WHERE cache_key = ?;",
        (cache_key,),
    ).fetchone()

    if not row:
        return None

    if int(row["updated_at"]) + int(row["ttl_seconds"]) < now:
        return None

    try:
        return json.loads(row["payload_json"])
    except Exception:
        return None


def cache_set(cache_key: str, payload: dict, ttl_seconds: int):
    db = get_db()
    now = int(time.time())

    db.execute(
        """
        INSERT INTO cache(cache_key, payload_json, updated_at, ttl_seconds)
        VALUES(?,?,?,?)
        ON CONFLICT(cache_key) DO UPDATE SET
            payload_json=excluded.payload_json,
            updated_at=excluded.updated_at,
            ttl_seconds=excluded.ttl_seconds
        """,
        (cache_key, json.dumps(payload), now, int(ttl_seconds)),
    )
    db.commit()