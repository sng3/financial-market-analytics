from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import yfinance as yf


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _safe_float(x) -> Optional[float]:
    try:
        if x is None:
            return None
        return float(x)
    except Exception:
        return None


def _stub_search_universe() -> List[Dict[str, str]]:
    return [
        {"ticker": "AAPL", "name": "Apple Inc."},
        {"ticker": "NVDA", "name": "NVIDIA Corporation"},
        {"ticker": "MSFT", "name": "Microsoft Corporation"},
        {"ticker": "AMZN", "name": "Amazon.com, Inc."},
        {"ticker": "GOOGL", "name": "Alphabet Inc. (Class A)"},
        {"ticker": "TSLA", "name": "Tesla, Inc."},
    ]


def _map_range_to_period_interval(range_value: str) -> tuple[str, str]:
    range_value = (range_value or "1Y").strip().upper()
    mapping = {
        "1D": ("1d", "5m"),
        "5D": ("5d", "30m"),
        "1M": ("1mo", "1d"),
        "6M": ("6mo", "1d"),
        "1Y": ("1y", "1d"),
        "MAX": ("max", "1wk"),
    }
    return mapping.get(range_value, ("1y", "1d"))


def search_tickers(q: str) -> List[Dict[str, str]]:
    q = (q or "").strip()
    if not q:
        return []

    results = []

    try:
        search = yf.Search(q, max_results=10)
        quotes = getattr(search, "quotes", []) or []

        for item in quotes:
            symbol = item.get("symbol")
            name = item.get("shortname") or item.get("longname")

            if not symbol or not name:
                continue

            results.append({
                "ticker": symbol,
                "name": name
            })

    except Exception:
        pass

    return results[:10]

def get_quote(ticker: str) -> Dict[str, Any]:
    ticker = (ticker or "").strip().upper()
    if not ticker:
        raise ValueError("ticker required")

    try:
        t = yf.Ticker(ticker)

        fi = getattr(t, "fast_info", None) or {}
        price = _safe_float(fi.get("last_price") or fi.get("lastPrice") or fi.get("last"))
        prev_close = _safe_float(fi.get("previous_close") or fi.get("previousClose"))

        if price is None or prev_close is None:
            hist = t.history(period="5d")
            if hist is not None and not hist.empty and "Close" in hist.columns:
                if price is None:
                    price = _safe_float(hist["Close"].iloc[-1])
                if prev_close is None:
                    prev_close = _safe_float(hist["Close"].iloc[-2]) if len(hist) >= 2 else price

        if price is None or prev_close is None:
            raise RuntimeError("Could not resolve quote from yfinance")

        name = None
        try:
            info = getattr(t, "info", None) or {}
            name = info.get("shortName") or info.get("longName")
        except Exception:
            name = None

        if not name:
            name = f"{ticker} Company"

        change = price - prev_close
        change_pct = (change / prev_close) * 100 if prev_close else 0.0

        return {
            "ticker": ticker,
            "name": name,
            "price": round(price, 2),
            "prevClose": round(prev_close, 2),
            "change": round(change, 2),
            "changePct": round(change_pct, 2),
            "updatedAt": _utc_now_iso(),
        }

    except Exception:
        price = 182.45
        prev_close = 180.32
        change = price - prev_close
        change_pct = (change / prev_close) * 100 if prev_close else 0.0

        return {
            "ticker": ticker,
            "name": f"{ticker} Example Company",
            "price": round(price, 2),
            "prevClose": round(prev_close, 2),
            "change": round(change, 2),
            "changePct": round(change_pct, 2),
            "updatedAt": _utc_now_iso(),
        }


def get_history(ticker: str, days: int = 30) -> Dict[str, Any]:
    ticker = (ticker or "").strip().upper()
    if not ticker:
        raise ValueError("ticker required")

    days = int(days)
    if days <= 0:
        raise ValueError("days must be > 0")

    try:
        t = yf.Ticker(ticker)
        start = (datetime.now(timezone.utc) - timedelta(days=days * 2)).date().isoformat()
        df = t.history(start=start)

        if df is None or df.empty or "Close" not in df.columns:
            raise RuntimeError("No history data returned")

        series: List[Dict[str, Any]] = []
        for idx, row in df.iterrows():
            close = _safe_float(row.get("Close"))
            if close is None:
                continue

            try:
                date_str = idx.date().isoformat()
            except Exception:
                date_str = str(idx)[:10]

            series.append({"date": date_str, "close": round(close, 2)})

        if len(series) > days:
            series = series[-days:]

        return {"ticker": ticker, "days": days, "series": series}

    except Exception:
        base = 170.0
        series: List[Dict[str, Any]] = []

        for i in range(days):
            date = (datetime.now(timezone.utc) - timedelta(days=(days - i))).date().isoformat()
            base += 0.25 if i % 2 == 0 else -0.12
            series.append({"date": date, "close": round(base, 2)})

        return {"ticker": ticker, "days": days, "series": series}


def get_history_by_range(ticker: str, range_value: str = "1Y") -> Dict[str, Any]:
    ticker = (ticker or "").strip().upper()
    if not ticker:
        raise ValueError("ticker required")

    period, interval = _map_range_to_period_interval(range_value)
    t = yf.Ticker(ticker)
    df = t.history(period=period, interval=interval)

    if df is None or df.empty or "Close" not in df.columns:
        return {
            "ticker": ticker,
            "range": range_value,
            "series": [],
        }

    series: List[Dict[str, Any]] = []

    for idx, row in df.iterrows():
        close = _safe_float(row.get("Close"))
        if close is None:
            continue

        try:
            if range_value.upper() in ("1D", "5D"):
                label = idx.strftime("%Y-%m-%d %H:%M")
            else:
                label = idx.strftime("%Y-%m-%d")
        except Exception:
            label = str(idx)

        series.append({
            "t": label,
            "v": round(close, 2),
        })

    return {
        "ticker": ticker,
        "range": range_value,
        "series": series,
    }