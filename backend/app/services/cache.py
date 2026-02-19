# backend/app/services/cache.py
from __future__ import annotations

import time
from typing import Any, Dict, Optional, Tuple

_cache: Dict[str, Tuple[float, Any]] = {}


def cache_get(key: str) -> Optional[Any]:
    item = _cache.get(key)
    if not item:
        return None

    expires_at, value = item
    if time.time() >= expires_at:
        _cache.pop(key, None)
        return None

    return value


def cache_set(key: str, value: Any, ttl_seconds: int = 60) -> Any:
    _cache[key] = (time.time() + ttl_seconds, value)
    return value


def cache_clear(prefix: Optional[str] = None) -> None:
    if prefix is None:
        _cache.clear()
        return

    keys = [k for k in _cache.keys() if k.startswith(prefix)]
    for k in keys:
        _cache.pop(k, None)
