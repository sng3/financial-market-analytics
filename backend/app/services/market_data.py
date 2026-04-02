from __future__ import annotations

from datetime import datetime, timezone, time
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

import yfinance as yf

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


# =========================
# SEARCH
# =========================
def search_tickers(q: str) -> List[Dict[str, str]]:
    q = (q or "").strip()
    if not q:
        return []

    try:
        search = yf.Search(q, max_results=10)
        quotes = getattr(search, "quotes", []) or []

        results: List[Dict[str, str]] = []
        seen: set[str] = set()

        for item in quotes:
            symbol = str(item.get("symbol") or "").strip().upper()
            name = str(
                item.get("shortname")
                or item.get("longname")
                or item.get("displayName")
                or ""
            ).strip()

            if not symbol or not name or symbol in seen:
                continue

            seen.add(symbol)
            results.append({
                "ticker": symbol,
                "name": name,
            })

        return results[:10]

    except Exception:
        return []


# =========================
# QUOTE
# =========================
def get_quote(ticker: str) -> Dict[str, Any]:
    ticker = (ticker or "").strip().upper()
    if not ticker:
        raise ValueError("ticker required")

    stock = yf.Ticker(ticker)

    info: Dict[str, Any] = {}
    try:
        info = stock.info or {}
    except Exception:
        info = {}

    hist = stock.history(period="5d", interval="1d", auto_adjust=False)

    if hist is None or hist.empty or "Close" not in hist.columns:
        raise RuntimeError(f"No quote data found for {ticker}")

    closes = hist["Close"].dropna()

    if closes.empty:
        raise RuntimeError(f"No closing price data found for {ticker}")

    price = float(closes.iloc[-1])
    prev_close = float(closes.iloc[-2]) if len(closes) >= 2 else price

    change = price - prev_close
    change_pct = (change / prev_close) * 100 if prev_close else 0.0

    name = (
        info.get("shortName")
        or info.get("longName")
        or info.get("displayName")
        or ticker
    )

    return {
        "ticker": ticker,
        "name": name,
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


# =========================
# HISTORY (CHART)
# =========================
def get_history_by_range(ticker: str, range_value: str = "1Y") -> Dict[str, Any]:
    ticker = (ticker or "").strip().upper()

    try:
        if not ticker:
            raise ValueError("ticker required")

        period, interval = _map_range_to_period_interval(range_value)

        df = yf.Ticker(ticker).history(
            period=period,
            interval=interval,
            auto_adjust=False,
        )

        if df is None or df.empty or "Close" not in df.columns:
            return {
                "ticker": ticker,
                "range": range_value,
                "series": [],
            }

        series = []
        for idx, row in df.iterrows():
            close_value = _safe_float(row.get("Close"))
            if close_value is None:
                continue

            series.append({
                "t": idx.strftime("%Y-%m-%d"),
                "v": round(close_value, 2),
            })

        return {
            "ticker": ticker,
            "range": range_value,
            "series": series,
        }

    except Exception as e:
        print("HISTORY ERROR:", ticker, range_value, e)
        return {
            "ticker": ticker,
            "range": range_value,
            "series": [],
        }