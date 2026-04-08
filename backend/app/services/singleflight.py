import threading

from app.services.cache import cache_get, cache_set

_inflight_events = {}
_inflight_lock = threading.Lock()


def get_or_compute(cache_key: str, ttl_seconds: int, compute_fn, wait_timeout: float = 10.0):
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    is_leader = False

    with _inflight_lock:
        event = _inflight_events.get(cache_key)
        if event is None:
            event = threading.Event()
            _inflight_events[cache_key] = event
            is_leader = True

    if is_leader:
        try:
            payload = compute_fn()
            cache_set(cache_key, payload, ttl_seconds=ttl_seconds)
            return payload
        finally:
            with _inflight_lock:
                event = _inflight_events.pop(cache_key, None)
                if event is not None:
                    event.set()

    event.wait(timeout=wait_timeout)

    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    payload = compute_fn()
    cache_set(cache_key, payload, ttl_seconds=ttl_seconds)
    return payload