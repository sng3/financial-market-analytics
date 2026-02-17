# =====================
# Imports
# =====================
from flask import Flask, request, jsonify
from flask_cors import CORS
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from urllib.parse import urlparse

import yfinance as yf
import time
import os
import requests
import math

# =====================
# App setup
# =====================
app = Flask(__name__)
CORS(app)

# =====================
# Sentiment globals
# =====================
analyzer = SentimentIntensityAnalyzer()

# Simple in-memory cache to reduce repeated calls
_SENTIMENT_CACHE = {}  # { ticker: (expires_at, payload) }
CACHE_TTL_SECONDS = 60

_BAD_DOMAINS = {
    "consent.yahoo.com",
    "guce.yahoo.com",
}


def _label_from_score(score: float) -> str:
    if score >= 0.15:
        return "Positive"
    if score <= -0.15:
        return "Negative"
    return "Neutral"


def _clean_url(u: str) -> str:
    u = (u or "").strip()
    if not u:
        return ""
    if not (u.startswith("http://") or u.startswith("https://")):
        return ""
    try:
        host = (urlparse(u).netloc or "").lower()
        if host in _BAD_DOMAINS:
            return ""
    except Exception:
        return ""
    return u


def _looks_relevant(ticker: str, company_name: str, title: str, desc: str) -> bool:
    text = f"{title} {desc}".lower()

    # Must mention ticker or company name somewhere
    has_identity = (ticker.lower() in text) or (company_name.lower() in text)

    # Must look like finance/markets content
    finance_keywords = [
        "stock", "shares", "earnings", "revenue", "guidance", "dividend",
        "nasdaq", "nyse", "market", "investor", "analyst", "price target",
        "quarter", "sec", "ipo", "futures", "options"
    ]
    has_finance = any(k in text for k in finance_keywords)

    return has_identity and has_finance


def _yf_news_items(ticker: str):
    t = yf.Ticker(ticker)
    try:
        news = getattr(t, "news", None) or []
    except Exception:
        news = []

    items = []
    scores = []

    for n in news[:15]:
        title = (n.get("title") or "").strip()
        if not title:
            continue

        s = analyzer.polarity_scores(title)["compound"]

        raw_url = n.get("link") or n.get("url") or ""
        url = _clean_url(raw_url)
        if not url:
            continue

        scores.append(s)
        items.append({
            "title": title,
            "score": float(s),
            "publisher": n.get("publisher") or "",
            "publishedAt": n.get("providerPublishTime") or None,
            "url": url,
            "imageUrl": ""
        })

    avg = sum(scores) / len(scores) if scores else 0.0
    return avg, items

def _sma(values, window: int):
    if len(values) < window:
        return None
    return sum(values[-window:]) / window

def _rsi(closes, period: int = 14):
    """
    Simple RSI using average gains/losses over `period` (Wilder-style-ish).
    Returns None if not enough data.
    """
    if len(closes) < period + 1:
        return None

    gains = []
    losses = []
    for i in range(1, period + 1):
        diff = closes[i] - closes[i - 1]
        if diff >= 0:
            gains.append(diff)
            losses.append(0.0)
        else:
            gains.append(0.0)
            losses.append(-diff)

    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period

    if avg_loss == 0:
        return 100.0

    rs = avg_gain / avg_loss
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return rsi

# =====================
# Routes
# =====================

@app.get("/api/search")
def search():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify([])

    if len(q) <= 6 and q.replace(".", "").replace("-", "").isalnum():
        return jsonify([{"ticker": q.upper(), "name": q.upper()}])

    results = yf.Search(q, max_results=8).quotes
    out = []

    for r in results:
        sym = r.get("symbol")
        name = r.get("shortname") or r.get("longname") or sym
        if sym:
            out.append({"ticker": sym, "name": name})
    return jsonify(out)


@app.get("/api/stock")
def get_stock():
    ticker = request.args.get("ticker", "").upper().strip()
    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    t = yf.Ticker(ticker)
    hist = t.history(period="2d", interval="1d")

    if hist.empty or len(hist) < 2:
        return jsonify({"error": f"no data for {ticker}"}), 404

    prev_close = float(hist["Close"].iloc[-2])
    price = float(hist["Close"].iloc[-1])

    change = price - prev_close
    change_pct = (change / prev_close) * 100 if prev_close != 0 else 0.0

    try:
        name = t.info.get("shortName") or t.info.get("longName")
    except Exception:
        name = ticker

    return jsonify({
        "ticker": ticker,
        "name": name,
        "price": price,
        "prevClose": prev_close,
        "change": change,
        "changePct": change_pct,
        "updatedAt": "now"
    })


@app.get("/api/sentiment")
def sentiment():
    ticker = request.args.get("ticker", "").upper().strip()
    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    # Cache
    now = time.time()
    cached = _SENTIMENT_CACHE.get(ticker)
    if cached and cached[0] > now:
        return jsonify(cached[1])

    api_key = os.environ.get("NEWS_API_KEY")

    provider_used = "none"
    provider_status = "ok"
    warning = ""

    avg = 0.0
    items = []

    # ---------------------------
    # 1) Try NewsAPI first
    # ---------------------------
    if api_key:
        url = "https://newsapi.org/v2/everything"

        # Try to get company name
        try:
            tinfo = yf.Ticker(ticker).info
            company_name = (tinfo.get("shortName") or tinfo.get("longName") or ticker).strip()
        except Exception:
            company_name = ticker

        query = f'("{ticker}" OR "{company_name}") AND (stock OR shares OR earnings OR market OR finance OR investor)'
        params = {
            "q": query,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 25,
        }
        headers = {"X-Api-Key": api_key}

        try:
            r = requests.get(url, params=params, headers=headers, timeout=10)
            data = r.json()

            # Quota / rate limit detection
            if r.status_code == 429 or data.get("code") in ("rateLimited", "tooManyRequests"):
                provider_status = "rate_limited"
                warning = data.get("message") or "NewsAPI rate limit reached"
            elif r.status_code != 200 or data.get("status") != "ok":
                provider_status = "error"
                warning = data.get("message") or "NewsAPI error"
            else:
                articles = data.get("articles") or []
                if articles:
                    provider_used = "newsapi"
                    scores = []
                    filtered_items = []

                    for a in articles[:25]:
                        title = (a.get("title") or "").strip()
                        desc = (a.get("description") or "").strip()

                        if not title and not desc:
                            continue

                        # Hard relevance filter
                        if not _looks_relevant(ticker, company_name, title, desc):
                            continue

                        # Filter bad / unavailable-ish links
                        raw_url = a.get("url") or ""
                        link = _clean_url(raw_url)
                        if not link:
                            continue

                        text = (title + ". " + desc).strip()
                        s = analyzer.polarity_scores(text)["compound"]
                        scores.append(s)

                        source = a.get("source") or {}
                        filtered_items.append({
                            "title": title or desc[:80],
                            "score": float(s),
                            "publisher": source.get("name") or "",
                            "publishedAt": a.get("publishedAt") or None,
                            "url": link,
                            "imageUrl": a.get("urlToImage") or ""
                        })

                    items = filtered_items

                    # If filtering removed everything, treat as no usable NewsAPI data
                    if not items:
                        provider_status = "error" if provider_status == "ok" else provider_status
                        warning = (warning or "NewsAPI returned unrelated results") + " (filtered)"

                    avg = sum(scores) / len(scores) if scores else 0.0

        except Exception:
            provider_status = "error"
            warning = "Failed to call NewsAPI"
    else:
        provider_status = "error"
        warning = "NEWS_API_KEY is not set"

    # ---------------------------
    # 2) Fallback to yfinance
    # ---------------------------
    if provider_used != "newsapi" or len(items) == 0:
        yf_avg, yf_items = _yf_news_items(ticker)
        if yf_items:
            provider_used = "yfinance"
            avg = yf_avg
            items = yf_items
            if warning:
                warning = f"{warning} (fallback to yfinance)"
        else:
            provider_used = provider_used or "none"

    # Confidence: 0..1 (more items + stronger polarity => higher confidence)
    if not items:
        conf = 0.0
    else:
        n_factor = min(1.0, len(items) / 10.0)
        mag_factor = min(1.0, abs(avg) / 0.8)
        conf = 0.15 + 0.85 * (0.6 * n_factor + 0.4 * mag_factor)

    payload = {
        "ticker": ticker,
        "label": _label_from_score(avg),
        "score": float(avg),
        "confidence": float(conf),
        "updatedAt": "now",
        "items": items,
        "health": {
            "provider": provider_used,     # "newsapi" | "yfinance" | "none"
            "status": provider_status,     # "ok" | "rate_limited" | "error"
            "warning": warning
        }
    }

    _SENTIMENT_CACHE[ticker] = (now + CACHE_TTL_SECONDS, payload)
    return jsonify(payload)

@app.get("/api/indicators")
def indicators():
    ticker = request.args.get("ticker", "").upper().strip()
    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    # Get enough history for SMA and RSI
    # 60 trading days is plenty for SMA20/SMA50 + RSI14
    t = yf.Ticker(ticker)
    hist = t.history(period="3mo", interval="1d")

    if hist.empty or "Close" not in hist:
        return jsonify({"error": f"no data for {ticker}"}), 404

    closes = [float(x) for x in hist["Close"].dropna().tolist()]
    if len(closes) < 15:
        return jsonify({"error": f"not enough data for {ticker}"}), 404

    # Compute SMA(20) and SMA(50)
    sma20 = _sma(closes, 20)
    sma50 = _sma(closes, 50)

    # Trend: compare SMA20 to SMA50 (common quick trend signal)
    sma_trend = "Neutral"
    if sma20 is not None and sma50 is not None:
        if sma20 > sma50:
            sma_trend = "Up"
        elif sma20 < sma50:
            sma_trend = "Down"

    # RSI(14) using the most recent 15 points
    rsi14 = _rsi(closes[-15:], 14)

    return jsonify({
        "ticker": ticker,
        "rsi": float(rsi14) if rsi14 is not None else None,
        "sma20": float(sma20) if sma20 is not None else None,
        "sma50": float(sma50) if sma50 is not None else None,
        "smaTrend": sma_trend,
        "updatedAt": "now"
    })

# =====================
# Entry point
# =====================
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)