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
