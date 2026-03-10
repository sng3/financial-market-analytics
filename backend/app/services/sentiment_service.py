import os
import time
import requests
from urllib.parse import urlparse

import yfinance as yf
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

_BAD_DOMAINS = {"consent.yahoo.com", "guce.yahoo.com"}

def _label_from_score(score: float) -> str:
    if score >= 0.15:
        return "Positive"
    if score <= -0.15:
        return "Negative"
    return "Neutral"

def _clean_url(u: str) -> str:
    u = (u or "").strip()
    if not u or not (u.startswith("http://") or u.startswith("https://")):
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

    items, scores = [], []
    for n in news[:15]:
        title = (n.get("title") or "").strip()
        if not title:
            continue

        s = analyzer.polarity_scores(title)["compound"]
        url = _clean_url(n.get("link") or n.get("url") or "")
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

def get_sentiment(ticker: str):
    ticker = (ticker or "").strip().upper()
    if not ticker:
        raise ValueError("ticker required")

    api_key = os.environ.get("NEWS_API_KEY")

    provider_used = "none"
    provider_status = "ok"
    warning = ""

    avg = 0.0
    items = []

    if api_key:
        url = "https://newsapi.org/v2/everything"

        try:
            tinfo = yf.Ticker(ticker).info or {}
            company_name = (tinfo.get("shortName") or tinfo.get("longName") or ticker).strip()
        except Exception:
            company_name = ticker

        query = f'("{ticker}" OR "{company_name}") AND (stock OR shares OR earnings OR market OR finance OR investor)'
        params = {"q": query, "language": "en", "sortBy": "publishedAt", "pageSize": 25}
        headers = {"X-Api-Key": api_key}

        try:
            r = requests.get(url, params=params, headers=headers, timeout=10)
            data = r.json() if r is not None else {}

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
                        if not _looks_relevant(ticker, company_name, title, desc):
                            continue

                        link = _clean_url(a.get("url") or "")
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

    if provider_used != "newsapi" or len(items) == 0:
        yf_avg, yf_items = _yf_news_items(ticker)
        if yf_items:
            provider_used = "yfinance"
            avg = yf_avg
            items = yf_items
            if warning:
                warning = f"{warning} (fallback to yfinance)"

    if not items:
        conf = 0.0
    else:
        n_factor = min(1.0, len(items) / 10.0)
        mag_factor = min(1.0, abs(avg) / 0.8)
        conf = 0.15 + 0.85 * (0.6 * n_factor + 0.4 * mag_factor)

    return {
        "ticker": ticker,
        "label": _label_from_score(avg),
        "score": float(avg),
        "confidence": float(conf),
        "updatedAt": "now",
        "items": items,
        "health": {
            "provider": provider_used,
            "status": provider_status,
            "warning": warning
        }
    }