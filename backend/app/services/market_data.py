import random
import time
from datetime import datetime, timedelta


def get_quote(ticker: str) -> dict:
    """
    Returns a single stock quote.
    Stub implementation for now.
    Swap internals with robin_stocks later.
    """
    ticker = (ticker or "").strip().upper()

    price = round(random.uniform(50, 500), 2)
    change = round(random.uniform(-5, 5), 2)

    prev_price = price - change if (price - change) != 0 else price
    change_percent = round((change / prev_price) * 100, 2)

    return {
        "ticker": ticker,
        "price": price,
        "change": change,
        "changePercent": change_percent,
        "timestamp": int(time.time()),
    }


def get_history(ticker: str, days: int = 30) -> dict:
    """
    Returns historical closing prices for the last N days.
    Stub implementation for now.
    """
    ticker = (ticker or "").strip().upper()
    days = int(days)

    base_price = random.uniform(50, 500)
    series = []

    for i in range(days):
        date = (datetime.utcnow() - timedelta(days=(days - i))).date()
        base_price += random.uniform(-2, 2)

        series.append({
            "date": date.isoformat(),
            "close": round(base_price, 2),
        })

    return {
        "ticker": ticker,
        "days": days,
        "series": series,
    }

def search_tickers(q: str):
    q = (q or "").strip()
    if not q:
        return []

    sample = [
        {"ticker": "AAPL", "name": "Apple Inc."},
        {"ticker": "NVDA", "name": "NVIDIA Corporation"},
        {"ticker": "MSFT", "name": "Microsoft Corporation"},
        {"ticker": "AMZN", "name": "Amazon.com, Inc."},
        {"ticker": "GOOGL", "name": "Alphabet Inc. (Class A)"},
        {"ticker": "TSLA", "name": "Tesla, Inc."},
    ]

    q_upper = q.upper()
    q_lower = q.lower()
    return [x for x in sample if q_upper in x["ticker"] or q_lower in x["name"].lower()]

