# =====================
# Imports
# =====================
from flask import Flask, request, jsonify
from flask_cors import CORS
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from urllib.parse import urlparse
from datetime import datetime

import yfinance as yf
import time
import os
import requests
import sqlite3
import json
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

_BAD_DOMAINS = {
    "consent.yahoo.com",
    "guce.yahoo.com",
}

# =====================
# SQLite cache + DB setup
# =====================
DB_PATH = os.environ.get("DB_PATH", "app.db")


def db_conn():
    # check_same_thread=False helps avoid SQLite thread errors in dev server
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = db_conn()
    cur = conn.cursor()

    # Generic cache table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS cache (
        cache_key TEXT PRIMARY KEY,
        payload_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        ttl_seconds INTEGER NOT NULL
    )
    """)

    conn.commit()
    conn.close()


def cache_get(key: str):
    now = int(time.time())
    conn = db_conn()
    cur = conn.cursor()
    cur.execute("SELECT payload_json, updated_at, ttl_seconds FROM cache WHERE cache_key=?", (key,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return None

    if row["updated_at"] + row["ttl_seconds"] < now:
        return None

    try:
        return json.loads(row["payload_json"])
    except Exception:
        return None


def cache_set(key: str, payload: dict, ttl: int):
    now = int(time.time())
    conn = db_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO cache(cache_key, payload_json, updated_at, ttl_seconds)
        VALUES(?,?,?,?)
        ON CONFLICT(cache_key) DO UPDATE SET
            payload_json=excluded.payload_json,
            updated_at=excluded.updated_at,
            ttl_seconds=excluded.ttl_seconds
    """, (key, json.dumps(payload), now, int(ttl)))
    conn.commit()
    conn.close()


# =====================
# Helpers
# =====================
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

    has_identity = (ticker.lower() in text) or (company_name.lower() in text)

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


def _rolling_sma_series(values, window: int):
    out = []
    s = 0.0
    for i, v in enumerate(values):
        s += v
        if i >= window:
            s -= values[i - window]
        if i >= window - 1:
            out.append(s / window)
        else:
            out.append(None)
    return out

def _rsi_series(closes, period: int = 14):
    """
    Wilder RSI series.
    Returns list of RSI values aligned to closes; first (period) values are None.
    """
    n = len(closes)
    if n < period + 1:
        return [None] * n

    rsis = [None] * n
    gains = 0.0
    losses = 0.0

    # Seed first period
    for i in range(1, period + 1):
        diff = closes[i] - closes[i - 1]
        if diff >= 0:
            gains += diff
        else:
            losses += -diff

    avg_gain = gains / period
    avg_loss = losses / period

    def _calc_rsi(ag, al):
        if al == 0:
            return 100.0
        rs = ag / al
        return 100.0 - (100.0 / (1.0 + rs))

    rsis[period] = _calc_rsi(avg_gain, avg_loss)

    # Wilder smoothing
    for i in range(period + 1, n):
        diff = closes[i] - closes[i - 1]
        gain = diff if diff > 0 else 0.0
        loss = (-diff) if diff < 0 else 0.0

        avg_gain = ((avg_gain * (period - 1)) + gain) / period
        avg_loss = ((avg_loss * (period - 1)) + loss) / period
        rsis[i] = _calc_rsi(avg_gain, avg_loss)

    return rsis


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

    # Optional: cache stock summary briefly to reduce repeated calls
    cache_key = f"stock:{ticker}"
    cached_payload = cache_get(cache_key)
    if cached_payload:
        return jsonify(cached_payload)

    t = yf.Ticker(ticker)
    hist = t.history(period="2d", interval="1d")

    if hist.empty or len(hist) < 2:
        return jsonify({"error": f"no data for {ticker}"}), 404

    prev_close = float(hist["Close"].iloc[-2])
    price = float(hist["Close"].iloc[-1])

    change = price - prev_close
    change_pct = (change / prev_close) * 100 if prev_close != 0 else 0.0

    try:
        info = t.info or {}
        name = info.get("shortName") or info.get("longName") or ticker
    except Exception:
        name = ticker

    payload = {
        "ticker": ticker,
        "name": name,
        "price": price,
        "prevClose": prev_close,
        "change": change,
        "changePct": change_pct,
        "updatedAt": "now"
    }

    cache_set(cache_key, payload, ttl=30)
    return jsonify(payload)


@app.get("/api/sentiment")
def sentiment():
    ticker = request.args.get("ticker", "").upper().strip()
    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    # SQLite cache (replaces in-memory cache)
    cache_key = f"sentiment:{ticker}"
    cached_payload = cache_get(cache_key)
    if cached_payload:
        return jsonify(cached_payload)

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
            tinfo = yf.Ticker(ticker).info or {}
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
            data = r.json() if r is not None else {}

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

    # Cache sentiment for 10 minutes (change if you want)
    cache_set(cache_key, payload, ttl=600)
    return jsonify(payload)


@app.get("/api/indicator_series")
def indicator_series():
    ticker = request.args.get("ticker", "").upper().strip()
    period = (request.args.get("period") or "6mo").strip()
    interval = (request.args.get("interval") or "1d").strip()

    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    # Cache: same series result reused a lot
    cache_key = f"indicator_series:{ticker}:{period}:{interval}"
    cached = cache_get(cache_key)
    if cached:
        return jsonify(cached)

    t = yf.Ticker(ticker)
    hist = t.history(period=period, interval=interval)

    if hist.empty or "Close" not in hist:
        return jsonify({"error": f"no data for {ticker}"}), 404

    # Build arrays
    closes = [float(x) for x in hist["Close"].dropna().tolist()]
    # Align dates with closes: safest is to dropna from hist then take its index
    hist2 = hist.dropna(subset=["Close"]).copy()
    dates = [idx.strftime("%Y-%m-%d") for idx in hist2.index]

    if len(closes) != len(dates):
        # If mismatch occurs, rebuild closes from hist2 to guarantee alignment
        closes = [float(x) for x in hist2["Close"].tolist()]

    sma20 = _rolling_sma_series(closes, 20)
    sma50 = _rolling_sma_series(closes, 50)
    rsi14 = _rsi_series(closes, 14)

    payload = {
        "ticker": ticker,
        "period": period,
        "interval": interval,
        "timestamps": dates,
        "close": closes,
        "sma20": sma20,
        "sma50": sma50,
        "rsi14": rsi14,
        "updatedAt": int(time.time())
    }

    # Cache 5 minutes
    cache_set(cache_key, payload, ttl=300)
    return jsonify(payload)

@app.get("/api/debug_tables")
def debug_tables():
    conn = db_conn()
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cur.fetchall()]
    conn.close()
    return jsonify(tables)

# =====================
# Entry point
# =====================
if __name__ == "__main__":
    init_db()
    app.run(host="127.0.0.1", port=5000, debug=True)