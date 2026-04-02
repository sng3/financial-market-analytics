from __future__ import annotations

from typing import Any, Dict, List

from app.db import get_db
from app.services.notification_service import (
    send_email_notification,
    send_sms_notification,
    send_push_notification,
    build_alert_email,
)
from app.services.sentiment_service import get_sentiment


def _get_user_news_tickers(user_id: int) -> List[str]:
    db = get_db()

    rows = db.execute(
        """
        SELECT DISTINCT wi.ticker
        FROM watchlists w
        JOIN watchlist_items wi ON wi.watchlist_id = w.id
        WHERE w.user_id = ?
        ORDER BY wi.ticker ASC;
        """,
        (user_id,),
    ).fetchall()

    return [str(row["ticker"]).strip().upper() for row in rows if row["ticker"]]


def _already_sent_article(user_id: int, article_url: str) -> bool:
    db = get_db()

    row = db.execute(
        """
        SELECT 1
        FROM news_alerts_sent
        WHERE user_id = ? AND article_url = ?;
        """,
        (user_id, article_url),
    ).fetchone()

    return row is not None


def _mark_article_sent(user_id: int, ticker: str, article_url: str) -> None:
    db = get_db()

    db.execute(
        """
        INSERT OR IGNORE INTO news_alerts_sent (user_id, ticker, article_url)
        VALUES (?, ?, ?);
        """,
        (user_id, ticker, article_url),
    )
    db.commit()


def check_user_news_alerts(user_id: int) -> Dict[str, Any]:
    db = get_db()

    user = db.execute(
        """
        SELECT
            id,
            email,
            phone,
            email_alerts,
            news_alerts,
            sms_notifications,
            push_notifications
        FROM users
        WHERE id = ?;
        """,
        (user_id,),
    ).fetchone()

    if not user:
        print(f"NEWS ALERT CHECK FAILED | user_id={user_id} | reason=User not found")
        return {
            "ok": False,
            "error": "User not found",
            "checked": 0,
            "triggered": 0,
            "results": [],
        }

    if not bool(user["news_alerts"]):
        print(f"NEWS ALERT CHECK SKIPPED | user_id={user_id} | reason=News alerts disabled")
        return {
            "ok": True,
            "message": "News alerts are disabled.",
            "checked": 0,
            "triggered": 0,
            "results": [],
        }

    tickers = _get_user_news_tickers(user_id)

    print(
        "NEWS ALERT CHECK START | "
        f"user_id={user_id} | "
        f"tracked_tickers={len(tickers)} | "
        f"tickers={tickers}"
    )

    checked = 0
    triggered = 0
    results: List[Dict[str, Any]] = []

    for ticker in tickers:
        checked += 1

        print(
            "NEWS ALERT EVALUATE | "
            f"user_id={user_id} | "
            f"ticker={ticker}"
        )

        try:
            sentiment_payload = get_sentiment(ticker)
            items = sentiment_payload.get("items", []) or []
            print(
                "NEWS FETCH OK | "
                f"user_id={user_id} | "
                f"ticker={ticker} | "
                f"items_found={len(items)}"
            )
        except Exception as e:
            print(
                "NEWS FETCH FAILED | "
                f"user_id={user_id} | "
                f"ticker={ticker} | "
                f"error={e}"
            )
            results.append({
                "ticker": ticker,
                "ok": False,
                "message": f"News lookup failed: {e}",
            })
            continue

        if not items:
            print(
                "NEWS ALERT NO ITEMS | "
                f"user_id={user_id} | "
                f"ticker={ticker}"
            )
            continue

        latest_item = items[0]

        headline = str(latest_item.get("title") or "").strip()
        publisher = str(latest_item.get("publisher") or "").strip()
        published_at = latest_item.get("publishedAt")
        article_url = str(latest_item.get("url") or "").strip()
        score = latest_item.get("score")

        if not article_url:
            print(
                "NEWS ALERT SKIPPED | "
                f"user_id={user_id} | "
                f"ticker={ticker} | "
                f"reason=Missing article URL"
            )
            continue

        if _already_sent_article(user_id, article_url):
            print(
                "NEWS ALERT ALREADY SENT | "
                f"user_id={user_id} | "
                f"ticker={ticker} | "
                f"url={article_url}"
            )
            continue

        print(
            "NEWS ALERT TRIGGERED | "
            f"user_id={user_id} | "
            f"ticker={ticker} | "
            f"headline={headline}"
        )

        subject, body = build_alert_email(
            alert_type="News Alert",
            ticker=ticker,
            details={
                "headline": headline,
                "publisher": publisher,
                "published_at": published_at,
                "sentiment_score": score,
                "article_url": article_url,
            },
            footer_message="This notification was sent because a new relevant news item was found for a stock in your watchlist.",
        )

        deliveries = []

        if bool(user["email_alerts"]) and user["email"]:
            email_result = send_email_notification(
                to_email=user["email"],
                subject=subject,
                body=body,
            )
            deliveries.append(email_result)
        else:
            print(
                "NEWS EMAIL DELIVERY SKIPPED | "
                f"user_id={user_id} | "
                f"ticker={ticker} | "
                f"reason=email notifications disabled or missing email"
            )

        if bool(user["sms_notifications"]) and user["phone"]:
            sms_result = send_sms_notification(
                phone=user["phone"],
                body=body,
            )
            deliveries.append(sms_result)
        else:
            print(
                "NEWS SMS DELIVERY SKIPPED | "
                f"user_id={user_id} | "
                f"ticker={ticker} | "
                f"reason=sms notifications disabled or missing phone"
            )

        if bool(user["push_notifications"]):
            push_result = send_push_notification(
                user_id=user["id"],
                title=subject,
                body=body,
            )
            deliveries.append(push_result)
        else:
            print(
                "NEWS PUSH DELIVERY SKIPPED | "
                f"user_id={user_id} | "
                f"ticker={ticker} | "
                f"reason=push notifications disabled"
            )

        _mark_article_sent(user_id, ticker, article_url)

        triggered += 1

        news_summary = {
            "ticker": ticker,
            "headline": headline,
            "articleUrl": article_url,
            "deliveries": deliveries,
        }

        print(f"NEWS DELIVERY RESULT | {news_summary}")

        results.append(news_summary)

    final_result = {
        "ok": True,
        "checked": checked,
        "triggered": triggered,
        "results": results,
    }

    print(
        "NEWS ALERT CHECK COMPLETE | "
        f"user_id={user_id} | "
        f"checked={checked} | "
        f"triggered={triggered}"
    )

    return final_result


def check_all_users_news_alerts() -> Dict[str, Any]:
    db = get_db()

    users = db.execute(
        "SELECT id FROM users;"
    ).fetchall()

    summary = {
        "ok": True,
        "usersChecked": 0,
        "tickersChecked": 0,
        "alertsTriggered": 0,
        "results": [],
    }

    print(f"NEWS SCHEDULER START | total_users={len(users)}")

    for user in users:
        result = check_user_news_alerts(user["id"])
        summary["usersChecked"] += 1
        summary["tickersChecked"] += int(result.get("checked", 0))
        summary["alertsTriggered"] += int(result.get("triggered", 0))
        summary["results"].append({
            "userId": user["id"],
            "result": result,
        })

    print(
        "NEWS SCHEDULER COMPLETE | "
        f"users={summary['usersChecked']} | "
        f"checked={summary['tickersChecked']} | "
        f"triggered={summary['alertsTriggered']}"
    )

    return summary