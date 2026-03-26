# import os
# import math
# import requests
# import yfinance as yf
# from datetime import datetime, timezone
# from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


# analyzer = SentimentIntensityAnalyzer()


# def _safe_iso_now() -> str:
#     return datetime.now(timezone.utc).isoformat()


# def _score_to_label(score: float) -> str:
#     if score >= 0.15:
#         return "Positive"
#     if score <= -0.15:
#         return "Negative"
#     return "Neutral"


# def _confidence_from_score(score: float) -> float:
#     return round(min(abs(score) * 100.0, 100.0), 2)


# def _is_valid_url(url: str) -> bool:
#     if not url or not isinstance(url, str):
#         return False
#     bad_hosts = ["consent.yahoo.com", "guce.yahoo.com"]
#     return url.startswith("http") and not any(host in url for host in bad_hosts)


# def _normalize_newsapi_item(article: dict) -> dict | None:
#     title = str(article.get("title") or "").strip()
#     url = str(article.get("url") or "").strip()
#     if not title or not _is_valid_url(url):
#         return None

#     published_at = article.get("publishedAt")
#     publisher = ""
#     source = article.get("source")
#     if isinstance(source, dict):
#         publisher = str(source.get("name") or "").strip()

#     score = analyzer.polarity_scores(title)["compound"]

#     return {
#         "title": title,
#         "score": score,
#         "publisher": publisher or "Unknown",
#         "publishedAt": published_at,
#         "url": url,
#         "imageUrl": str(article.get("urlToImage") or "").strip(),
#     }


# def _normalize_yf_item(item: dict) -> dict | None:
#     content = item.get("content") or {}

#     title = str(
#         item.get("title")
#         or content.get("title")
#         or ""
#     ).strip()

#     canonical = content.get("canonicalUrl") or {}
#     if isinstance(canonical, dict):
#         canonical_url = str(canonical.get("url") or "").strip()
#     else:
#         canonical_url = str(canonical or "").strip()

#     clickthrough = item.get("clickThroughUrl") or {}
#     if isinstance(clickthrough, dict):
#         clickthrough_url = str(clickthrough.get("url") or "").strip()
#     else:
#         clickthrough_url = str(clickthrough or "").strip()

#     url = (
#         canonical_url
#         or clickthrough_url
#         or str(item.get("link") or "").strip()
#         or str(content.get("clickThroughUrl", {}).get("url") or "").strip()
#     )

#     if not title or not _is_valid_url(url):
#         return None

#     provider = content.get("provider") or {}
#     if isinstance(provider, dict):
#         publisher = str(provider.get("displayName") or "").strip()
#     else:
#         publisher = ""

#     if not publisher:
#         publisher = str(item.get("publisher") or "Yahoo Finance").strip()

#     pub_ts = (
#         content.get("pubDate")
#         or item.get("providerPublishTime")
#         or item.get("publishedAt")
#     )

#     thumbnail = ""
#     thumb_block = content.get("thumbnail") or {}
#     resolutions = thumb_block.get("resolutions") or []
#     if isinstance(resolutions, list) and resolutions:
#         first = resolutions[0] or {}
#         if isinstance(first, dict):
#             thumbnail = str(first.get("url") or "").strip()

#     score = analyzer.polarity_scores(title)["compound"]

#     return {
#         "title": title,
#         "score": float(score),
#         "publisher": publisher,
#         "publishedAt": pub_ts,
#         "url": url,
#         "imageUrl": thumbnail,
#     }


# def _fetch_newsapi_articles(query: str) -> tuple[list[dict], dict]:
#     api_key = os.getenv("NEWS_API_KEY", "").strip()
#     if not api_key:
#         return [], {
#             "provider": "newsapi",
#             "status": "error",
#             "warning": "NEWS_API_KEY is missing.",
#         }

#     try:
#         res = requests.get(
#             "https://newsapi.org/v2/everything",
#             params={
#                 "q": query,
#                 "language": "en",
#                 "sortBy": "publishedAt",
#                 "pageSize": 10,
#                 "apiKey": api_key,
#             },
#             timeout=8,
#         )

#         if res.status_code == 429:
#             return [], {
#                 "provider": "newsapi",
#                 "status": "rate_limited",
#                 "warning": "NewsAPI rate limit reached.",
#             }

#         data = res.json()
#         articles = data.get("articles", []) if isinstance(data, dict) else []

#         items = []
#         for article in articles:
#             normalized = _normalize_newsapi_item(article)
#             if normalized:
#                 items.append(normalized)

#         return items, {
#             "provider": "newsapi",
#             "status": "ok",
#             "warning": "" if items else "NewsAPI returned no usable articles.",
#         }

#     except Exception as exc:
#         return [], {
#             "provider": "newsapi",
#             "status": "error",
#             "warning": f"NewsAPI request failed: {exc}",
#         }


# def _fetch_yfinance_articles(ticker: str) -> tuple[list[dict], dict]:
#     try:
#         tk = yf.Ticker(ticker)
#         raw_news = tk.news or []

#         items = []
#         for item in raw_news:
#             normalized = _normalize_yf_item(item)
#             if normalized:
#                 items.append(normalized)

#         return items, {
#             "provider": "yfinance",
#             "status": "ok" if items else "error",
#             "warning": "" if items else "yfinance returned no usable articles.",
#         }

#     except Exception as exc:
#         return [], {
#             "provider": "yfinance",
#             "status": "error",
#             "warning": f"yfinance request failed: {exc}",
#         }


# def get_sentiment(ticker: str, company_name: str = "") -> dict:
#     ticker = str(ticker or "").strip().upper()
#     company_name = str(company_name or "").strip()

#     if company_name:
#         query = f'"{ticker}" OR "{company_name}"'
#     else:
#         query = ticker

#     items, health = _fetch_newsapi_articles(query)

#     if not items:
#         items, health = _fetch_yfinance_articles(ticker)

#     if not items:
#         return {
#             "ticker": ticker,
#             "label": "Neutral",
#             "score": 0.0,
#             "confidence": 0.0,
#             "updatedAt": _safe_iso_now(),
#             "items": [],
#             "health": health,
#         }

#     avg_score = sum(item["score"] for item in items) / len(items)
#     avg_score = round(avg_score, 4)

#     return {
#         "ticker": ticker,
#         "label": _score_to_label(avg_score),
#         "score": avg_score,
#         "confidence": _confidence_from_score(avg_score),
#         "updatedAt": _safe_iso_now(),
#         "items": items[:5],
#         "health": health,
#     }

import os
from datetime import datetime, timezone
import requests
import yfinance as yf
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import statistics

analyzer = SentimentIntensityAnalyzer()

FINANCE_KEYWORDS = [
    "stock",
    "shares",
    "market",
    "earnings",
    "revenue",
    "guidance",
    "forecast",
    "analyst",
    "price target",
    "investor",
    "trading",
    "nasdaq",
    "nyse",
    "downgrade",
    "upgrade",
    "profit",
    "loss",
    "dividend",
    "valuation",
]


def _safe_iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _score_to_label(score: float) -> str:
    if score >= 0.15:
        return "Positive"
    if score <= -0.15:
        return "Negative"
    return "Neutral"


def _confidence_from_items(scores: list[float]) -> float:
    if not scores:
        return 0.0

    avg_score = sum(scores) / len(scores)

    if len(scores) == 1:
        agreement = 0.6
    else:
        variance = statistics.pvariance(scores)
        agreement = max(0.0, 1.0 - min(variance * 4.0, 1.0))

    count_factor = min(len(scores) / 5.0, 1.0)
    strength_factor = min(abs(avg_score) / 0.5, 1.0)

    confidence = (
        0.5 * agreement +
        0.3 * count_factor +
        0.2 * strength_factor
    ) * 100.0

    return round(max(0.0, min(confidence, 100.0)), 2)


def _is_valid_url(url: str) -> bool:
    if not url or not isinstance(url, str):
        return False

    bad_hosts = [
        "consent.yahoo.com",
        "guce.yahoo.com",
    ]

    return url.startswith("http") and not any(host in url for host in bad_hosts)


def _looks_financial(text: str) -> bool:
    text = (text or "").lower()
    return any(keyword in text for keyword in FINANCE_KEYWORDS)


def _is_relevant_article(title: str, ticker: str, company_name: str) -> bool:
    text = f"{title}".lower()
    ticker_lower = ticker.lower()
    company_lower = (company_name or "").lower()

    mentions_ticker = ticker_lower in text
    mentions_company = company_lower in text if company_lower else False
    mentions_finance = _looks_financial(text)

    if company_lower:
        return (mentions_company or mentions_ticker) and mentions_finance

    return mentions_ticker or mentions_finance


def _normalize_newsapi_item(article: dict, ticker: str, company_name: str) -> dict | None:
    title = str(article.get("title") or "").strip()
    url = str(article.get("url") or "").strip()

    if not title or not _is_valid_url(url):
        return None

    if not _is_relevant_article(title, ticker, company_name):
        return None

    source = article.get("source") or {}
    publisher = str(source.get("name") or "Unknown").strip()
    published_at = article.get("publishedAt")
    image_url = str(article.get("urlToImage") or "").strip()

    score = analyzer.polarity_scores(title)["compound"]

    return {
        "title": title,
        "score": float(score),
        "publisher": publisher,
        "publishedAt": published_at,
        "url": url,
        "imageUrl": image_url,
    }


def _normalize_yf_item(item: dict, ticker: str, company_name: str) -> dict | None:
    content = item.get("content") or {}

    title = str(
        item.get("title")
        or content.get("title")
        or ""
    ).strip()

    canonical = content.get("canonicalUrl") or {}
    if isinstance(canonical, dict):
        canonical_url = str(canonical.get("url") or "").strip()
    else:
        canonical_url = str(canonical or "").strip()

    clickthrough = item.get("clickThroughUrl") or {}
    if isinstance(clickthrough, dict):
        clickthrough_url = str(clickthrough.get("url") or "").strip()
    else:
        clickthrough_url = str(clickthrough or "").strip()

    content_click = content.get("clickThroughUrl") or {}
    if isinstance(content_click, dict):
        content_click_url = str(content_click.get("url") or "").strip()
    else:
        content_click_url = str(content_click or "").strip()

    url = canonical_url or clickthrough_url or content_click_url or str(item.get("link") or "").strip()

    if not title or not _is_valid_url(url):
        return None

    if not _is_relevant_article(title, ticker, company_name):
        return None

    provider = content.get("provider") or {}
    if isinstance(provider, dict):
        publisher = str(provider.get("displayName") or "").strip()
    else:
        publisher = ""

    if not publisher:
        publisher = str(item.get("publisher") or "Yahoo Finance").strip()

    published_at = (
        content.get("pubDate")
        or item.get("providerPublishTime")
        or item.get("publishedAt")
    )

    thumbnail = ""
    thumb_block = content.get("thumbnail") or {}
    resolutions = thumb_block.get("resolutions") or []
    if isinstance(resolutions, list) and resolutions:
        first = resolutions[0] or {}
        if isinstance(first, dict):
            thumbnail = str(first.get("url") or "").strip()

    score = analyzer.polarity_scores(title)["compound"]

    return {
        "title": title,
        "score": float(score),
        "publisher": publisher,
        "publishedAt": published_at,
        "url": url,
        "imageUrl": thumbnail,
    }


def _build_newsapi_query(ticker: str, company_name: str) -> str:
    base_parts = [f'"{ticker}"']
    if company_name:
        base_parts.append(f'"{company_name}"')

    finance_part = "(" + " OR ".join([
        "stock",
        "shares",
        "earnings",
        "market",
        "investor",
        "analyst",
        "revenue",
        "forecast",
    ]) + ")"

    return "(" + " OR ".join(base_parts) + f") AND {finance_part}"


def _fetch_newsapi_articles(ticker: str, company_name: str) -> tuple[list[dict], dict]:
    api_key = os.getenv("NEWS_API_KEY", "").strip()
    if not api_key:
        return [], {
            "provider": "newsapi",
            "status": "error",
            "warning": "NEWS_API_KEY is missing.",
        }

    query = _build_newsapi_query(ticker, company_name)

    try:
        res = requests.get(
            "https://newsapi.org/v2/everything",
            params={
                "q": query,
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": 15,
                "searchIn": "title,description",
                "apiKey": api_key,
            },
            timeout=8,
        )

        if res.status_code == 429:
            return [], {
                "provider": "newsapi",
                "status": "rate_limited",
                "warning": "NewsAPI rate limit reached.",
            }

        data = res.json()
        articles = data.get("articles", []) if isinstance(data, dict) else []

        items: list[dict] = []
        for article in articles:
            normalized = _normalize_newsapi_item(article, ticker, company_name)
            if normalized:
                items.append(normalized)

        return items, {
            "provider": "newsapi",
            "status": "ok" if items else "error",
            "warning": "" if items else "NewsAPI returned no usable articles.",
        }

    except Exception as exc:
        return [], {
            "provider": "newsapi",
            "status": "error",
            "warning": f"NewsAPI request failed: {exc}",
        }


def _fetch_yfinance_articles(ticker: str, company_name: str) -> tuple[list[dict], dict]:
    try:
        tk = yf.Ticker(ticker)
        raw_news = tk.news or []

        items: list[dict] = []
        for item in raw_news:
            normalized = _normalize_yf_item(item, ticker, company_name)
            if normalized:
                items.append(normalized)

        return items, {
            "provider": "yfinance",
            "status": "ok" if items else "error",
            "warning": "" if items else "yfinance returned no usable articles.",
        }

    except Exception as exc:
        return [], {
            "provider": "yfinance",
            "status": "error",
            "warning": f"yfinance request failed: {exc}",
        }


def get_sentiment(ticker: str, company_name: str = "") -> dict:
    ticker = str(ticker or "").strip().upper()
    company_name = str(company_name or "").strip()

    items, health = _fetch_newsapi_articles(ticker, company_name)

    if not items:
        items, health = _fetch_yfinance_articles(ticker, company_name)

    if not items:
        return {
            "ticker": ticker,
            "label": "Neutral",
            "score": 0.0,
            "confidence": 0.0,
            "updatedAt": _safe_iso_now(),
            "items": [],
            "health": health,
        }

    scores = [float(item["score"]) for item in items]

    avg_score = sum(scores) / len(scores)
    avg_score = round(avg_score, 4)

    confidence = _confidence_from_items(scores)

    return {
        "ticker": ticker,
        "label": _score_to_label(avg_score),
        "score": avg_score,
        "confidence": confidence,
        "updatedAt": _safe_iso_now(),
        "items": items[:5],
        "health": health,
    }