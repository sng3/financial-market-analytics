from __future__ import annotations

import time as time_module
from datetime import datetime, timezone, time
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

import yfinance as yf

from app.services.cache import cache_get, cache_set

NY_TZ = ZoneInfo("America/New_York")


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _safe_float(x: Any) -> Optional[float]:
    try:
        return float(x) if x is not None else None
    except Exception:
        return None


def _get_market_status() -> str:
    now_ny = datetime.now(NY_TZ)

    if now_ny.weekday() >= 5:
        return "Closed"

    current_time = now_ny.time()

    if time(9, 30) <= current_time < time(16, 0):
        return "Open"
    if time(16, 0) <= current_time < time(20, 0):
        return "After Hours"

    return "Closed"


def _map_range_to_period_interval(range_value: str) -> tuple[str, str]:
    mapping = {
        "1D": ("1d", "5m"),
        "5D": ("5d", "30m"),
        "1M": ("1mo", "1d"),
        "6M": ("6mo", "1d"),
        "1Y": ("1y", "1d"),
        "MAX": ("max", "1wk"),
    }
    return mapping.get((range_value or "1Y").upper(), ("1y", "1d"))


def _is_rate_limited_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return (
        "too many requests" in msg
        or "rate limited" in msg
        or "429" in msg
    )


def _retry_yahoo(fetch_fn, *, retries: int = 3, base_sleep: float = 1.25):
    last_error = None

    for attempt in range(retries):
        try:
            return fetch_fn()
        except Exception as e:
            last_error = e

            if not _is_rate_limited_error(e):
                raise

            sleep_seconds = base_sleep * (attempt + 1)
            print(f"Yahoo retry {attempt + 1}/{retries} after rate limit: {e}")
            time_module.sleep(sleep_seconds)

    raise last_error if last_error else RuntimeError("Yahoo request failed")


# =========================
# SEARCH
# =========================
def search_tickers(q: str) -> List[Dict[str, str]]:
    q = (q or "").strip()
    if not q:
        return []

    cache_key = f"search:{q.lower()}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    try:
        search = _retry_yahoo(lambda: yf.Search(q, max_results=10))
        quotes = getattr(search, "quotes", []) or []

        results: List[Dict[str, str]] = []
        seen: set[str] = set()

        for item in quotes:
            symbol = str(item.get("symbol") or "").strip().upper()
            name = str(
                item.get("shortname")
                or item.get("longname")
                or item.get("displayName")
                or symbol
            ).strip()

            if not symbol or symbol in seen:
                continue

            seen.add(symbol)
            results.append({
                "ticker": symbol,
                "name": name or symbol,
            })

        results = results[:10]
        cache_set(cache_key, results, ttl_seconds=300)
        return results

    except Exception as e:
        print(f"SEARCH ERROR: {q} {e}")
        return []


# =========================
# QUOTE
# =========================
def get_quote(ticker: str) -> Dict[str, Any]:
    ticker = (ticker or "").strip().upper()
    if not ticker:
        raise ValueError("ticker required")

    cache_key = f"svc_quote:{ticker}"
    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    stock = yf.Ticker(ticker)

    hist = _retry_yahoo(
        lambda: stock.history(period="5d", interval="1d", auto_adjust=False),
        retries=3,
        base_sleep=1.25,
    )

    if hist is None or hist.empty or "Close" not in hist.columns:
        raise RuntimeError(f"No quote data found for {ticker}")

    closes = hist["Close"].dropna()

    if closes.empty:
        raise RuntimeError(f"No closing price data found for {ticker}")

    price = float(closes.iloc[-1])
    prev_close = float(closes.iloc[-2]) if len(closes) >= 2 else price

    change = price - prev_close
    change_pct = (change / prev_close) * 100 if prev_close else 0.0

    payload = {
        "ticker": ticker,
        "name": ticker,
        "price": round(price, 2),
        "prevClose": round(prev_close, 2),
        "change": round(change, 2),
        "changePct": round(change_pct, 2),
        "updatedAt": _utc_now_iso(),
        "marketStatus": _get_market_status(),
        "extendedLabel": None,
        "extendedPrice": None,
        "extendedChange": None,
        "extendedChangePct": None,
        "extendedUpdatedAt": None,
        "atCloseUpdatedAt": None,
    }

    cache_set(cache_key, payload, ttl_seconds=30)
    return payload


# =========================
# HISTORY (CHART)
# =========================
def get_history_by_range(ticker: str, range_value: str = "1Y") -> Dict[str, Any]:
    ticker = (ticker or "").strip().upper()

    try:
        if not ticker:
            raise ValueError("ticker required")

        cache_key = f"svc_history:{ticker}:{(range_value or '1Y').upper()}"
        cached = cache_get(cache_key)
        if cached is not None:
            return cached

        period, interval = _map_range_to_period_interval(range_value)

        df = _retry_yahoo(
            lambda: yf.Ticker(ticker).history(
                period=period,
                interval=interval,
                auto_adjust=False,
            ),
            retries=3,
            base_sleep=1.25,
        )

        if df is None or df.empty or "Close" not in df.columns:
            payload = {
                "ticker": ticker,
                "range": range_value,
                "series": [],
            }
            cache_set(cache_key, payload, ttl_seconds=60)
            return payload

        series = []
        for idx, row in df.iterrows():
            close_value = _safe_float(row.get("Close"))
            if close_value is None:
                continue

            series.append({
                "t": idx.strftime("%Y-%m-%d"),
                "v": round(close_value, 2),
            })

        payload = {
            "ticker": ticker,
            "range": range_value,
            "series": series,
        }

        cache_set(cache_key, payload, ttl_seconds=300)
        return payload

    except Exception as e:
        print("HISTORY ERROR:", ticker, range_value, e)
        return {
            "ticker": ticker,
            "range": range_value,
            "series": [],
        }