import time
import threading

_cache = {}
_cache_lock = threading.Lock()


def cache_get(cache_key: str):
    now = int(time.time())

    with _cache_lock:
        entry = _cache.get(cache_key)
        if not entry:
            return None

        updated_at = entry["updated_at"]
        ttl_seconds = entry["ttl_seconds"]

        if updated_at + ttl_seconds < now:
            _cache.pop(cache_key, None)
            return None

        return entry["payload"]


def cache_set(cache_key: str, payload, ttl_seconds: int):
    now = int(time.time())

    with _cache_lock:
        _cache[cache_key] = {
            "payload": payload,
            "updated_at": now,
            "ttl_seconds": int(ttl_seconds),
        }


def cache_delete(cache_key: str):
    with _cache_lock:
        _cache.pop(cache_key, None)


def cache_clear():
    with _cache_lock:
        _cache.clear()