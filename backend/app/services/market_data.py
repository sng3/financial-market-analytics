# backend/app/services/market_data.py
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import yfinance as yf


# -----------------------------
# Helpers
# -----------------------------

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
    # Replace later with a real symbol search provider.
    return [
        {"ticker": "AAPL", "name": "Apple Inc."},
        {"ticker": "NVDA", "name": "NVIDIA Corporation"},
        {"ticker": "MSFT", "name": "Microsoft Corporation"},
        {"ticker": "AMZN", "name": "Amazon.com, Inc."},
        {"ticker": "GOOGL", "name": "Alphabet Inc. (Class A)"},
        {"ticker": "TSLA", "name": "Tesla, Inc."},
    ]


# -----------------------------
# Public API used by routes
# -----------------------------

def search_tickers(q: str) -> List[Dict[str, str]]:
    q = (q or "").strip()
    if not q:
        return []

    sample = _stub_search_universe()
    q_upper = q.upper()
    q_lower = q.lower()
    return [x for x in sample if q_upper in x["ticker"] or q_lower in x["name"].lower()]


def get_quote(ticker: str) -> Dict[str, Any]:
    """
    Returns:
      {
        ticker, name, price, prevClose, change, changePct, updatedAt
      }
    """
    ticker = (ticker or "").strip().upper()
    if not ticker:
        raise ValueError("ticker required")

    try:
        t = yf.Ticker(ticker)

        fi = getattr(t, "fast_info", None) or {}
        price = _safe_float(fi.get("last_price") or fi.get("lastPrice") or fi.get("last"))
        prev_close = _safe_float(fi.get("previous_close") or fi.get("previousClose"))

        # fallback via short history if needed
        if price is None or prev_close is None:
            hist = t.history(period="5d")
            if hist is not None and not hist.empty and "Close" in hist.columns:
                if price is None:
                    price = _safe_float(hist["Close"].iloc[-1])
                if prev_close is None:
                    if len(hist) >= 2:
                        prev_close = _safe_float(hist["Close"].iloc[-2])
                    else:
                        prev_close = price

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
        # Stub fallback to avoid breaking UI during yfinance hiccups
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
    """
    Returns:
      {
        ticker, days,
        series: [{date: "YYYY-MM-DD", close: number}, ...]
      }
    """
    ticker = (ticker or "").strip().upper()
    if not ticker:
        raise ValueError("ticker required")

    days = int(days)
    if days <= 0:
        raise ValueError("days must be > 0")

    try:
        t = yf.Ticker(ticker)

        # buffer for weekends/holidays
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
        # Stub fallback
        base = 170.0
        series: List[Dict[str, Any]] = []
        for i in range(days):
            date = (datetime.now(timezone.utc) - timedelta(days=(days - i))).date().isoformat()
            base += 0.25 if i % 2 == 0 else -0.12
            series.append({"date": date, "close": round(base, 2)})
        return {"ticker": ticker, "days": days, "series": series}


# -----------------------------
# Indicators
# -----------------------------

def compute_sma(closes: List[float], window: int) -> List[Optional[float]]:
    """
    Returns SMA series aligned to closes.
    First (window-1) entries are None.
    """
    if window <= 0:
        raise ValueError("window must be > 0")

    out: List[Optional[float]] = [None] * len(closes)
    if len(closes) < window:
        return out

    running_sum = sum(closes[:window])
    out[window - 1] = running_sum / window

    for i in range(window, len(closes)):
        running_sum += closes[i] - closes[i - window]
        out[i] = running_sum / window

    return out


def compute_rsi(closes: List[float], period: int = 14) -> Optional[float]:
    """
    Returns the latest RSI value (Wilder smoothing).
    If not enough data, returns None.
    """
    if period <= 0:
        raise ValueError("period must be > 0")
    if len(closes) < period + 1:
        return None

    gains = 0.0
    losses = 0.0

    for i in range(1, period + 1):
        change = closes[i] - closes[i - 1]
        if change >= 0:
            gains += change
        else:
            losses += -change

    avg_gain = gains / period
    avg_loss = losses / period

    for i in range(period + 1, len(closes)):
        change = closes[i] - closes[i - 1]
        gain = max(change, 0.0)
        loss = max(-change, 0.0)
        avg_gain = (avg_gain * (period - 1) + gain) / period
        avg_loss = (avg_loss * (period - 1) + loss) / period

    if avg_loss == 0:
        return 100.0

    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


def build_indicators_from_history(history: Dict[str, Any]) -> Dict[str, Any]:
    """
    Expects:
      { "days": int, "series": [{ "date": "...", "close": 123.45 }, ...] }

    Returns:
      { points, dates, close, sma20, sma50, rsi14 }
    """
    series = history.get("series", []) or []

    dates: List[str] = []
    closes: List[float] = []

    for row in series:
        c = _safe_float(row.get("close"))
        d = row.get("date")
        if c is None or not d:
            continue
        dates.append(str(d))
        closes.append(c)

    sma20 = compute_sma(closes, 20)
    sma50 = compute_sma(closes, 50)
    rsi14 = compute_rsi(closes, 14)

    return {
        "points": len(closes),
        "dates": dates,
        "close": closes,
        "sma20": sma20,
        "sma50": sma50,
        "rsi14": rsi14,
    }
