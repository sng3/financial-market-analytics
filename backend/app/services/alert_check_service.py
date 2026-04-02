from __future__ import annotations

from typing import Any, Dict, List

from app.db import get_db
from app.services.market_data import get_quote
from app.services.notification_service import (
    send_email_notification,
    send_sms_notification,
    send_push_notification,
    build_alert_email,
)


def check_user_price_alerts(user_id: int) -> Dict[str, Any]:
    db = get_db()

    user = db.execute(
        """
        SELECT
            id,
            email,
            phone,
            email_alerts,
            price_alerts,
            sms_notifications,
            push_notifications
        FROM users
        WHERE id = ?;
        """,
        (user_id,),
    ).fetchone()

    if not user:
        print(f"ALERT CHECK FAILED | user_id={user_id} | reason=User not found")
        return {
            "ok": False,
            "error": "User not found",
            "checked": 0,
            "triggered": 0,
            "results": [],
        }

    if not bool(user["price_alerts"]):
        print(f"ALERT CHECK SKIPPED | user_id={user_id} | reason=Price alerts disabled")
        return {
            "ok": True,
            "message": "Price alerts are disabled.",
            "checked": 0,
            "triggered": 0,
            "results": [],
        }

    alerts = db.execute(
        """
        SELECT id, user_id, ticker, condition, price, status, created_at
        FROM alerts
        WHERE user_id = ? AND status = 'Active'
        ORDER BY id DESC;
        """,
        (user_id,),
    ).fetchall()

    print(f"ALERT CHECK START | user_id={user_id} | active_alerts={len(alerts)}")

    checked = 0
    triggered = 0
    results: List[Dict[str, Any]] = []

    for alert in alerts:
        checked += 1

        print(
            "ALERT EVALUATE | "
            f"user_id={user_id} | "
            f"alert_id={alert['id']} | "
            f"ticker={alert['ticker']} | "
            f"condition={alert['condition']} | "
            f"target_price={alert['price']}"
        )

        try:
            quote = get_quote(alert["ticker"])
            current_price = float(quote["price"])
            print(
                "ALERT QUOTE OK | "
                f"alert_id={alert['id']} | "
                f"ticker={alert['ticker']} | "
                f"current_price={current_price}"
            )
        except Exception as e:
            print(
                "ALERT QUOTE FAILED | "
                f"alert_id={alert['id']} | "
                f"ticker={alert['ticker']} | "
                f"error={e}"
            )
            results.append({
                "alertId": str(alert["id"]),
                "ticker": alert["ticker"],
                "ok": False,
                "message": f"Quote lookup failed: {e}",
            })
            continue

        target_price = float(alert["price"])
        should_trigger = False

        if alert["condition"] == "Above" and current_price >= target_price:
            should_trigger = True

        if alert["condition"] == "Below" and current_price <= target_price:
            should_trigger = True

        db.execute(
            """
            UPDATE alerts
            SET last_checked_at = CURRENT_TIMESTAMP
            WHERE id = ?;
            """,
            (alert["id"],),
        )

        if not should_trigger:
            print(
                "ALERT NOT TRIGGERED | "
                f"alert_id={alert['id']} | "
                f"ticker={alert['ticker']} | "
                f"current_price={current_price} | "
                f"target_price={target_price}"
            )
            continue

        print(
            "ALERT TRIGGERED | "
            f"alert_id={alert['id']} | "
            f"ticker={alert['ticker']} | "
            f"current_price={current_price} | "
            f"target_price={target_price}"
        )

        subject, body = build_alert_email(
            alert_type="Price Alert Triggered",
            ticker=alert["ticker"],
            details={
                "condition": alert["condition"],
                "target_price": target_price,
                "current_price": current_price,
                "status": "Triggered",
            },
            footer_message="This notification was sent because your selected price alert condition was met.",
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
                "EMAIL DELIVERY SKIPPED | "
                f"user_id={user_id} | "
                f"alert_id={alert['id']} | "
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
                "SMS DELIVERY SKIPPED | "
                f"user_id={user_id} | "
                f"alert_id={alert['id']} | "
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
                "PUSH DELIVERY SKIPPED | "
                f"user_id={user_id} | "
                f"alert_id={alert['id']} | "
                f"reason=push notifications disabled"
            )

        db.execute(
            """
            UPDATE alerts
            SET status = 'Triggered',
                triggered_at = CURRENT_TIMESTAMP,
                last_checked_at = CURRENT_TIMESTAMP
            WHERE id = ?;
            """,
            (alert["id"],),
        )

        triggered += 1

        delivery_summary = {
            "alertId": str(alert["id"]),
            "ticker": alert["ticker"],
            "currentPrice": current_price,
            "deliveries": deliveries,
        }

        print(f"DELIVERY RESULT | {delivery_summary}")

        results.append(delivery_summary)

    final_result = {
        "ok": True,
        "checked": checked,
        "triggered": triggered,
        "results": results,
    }

    print(
        "ALERT CHECK COMPLETE | "
        f"user_id={user_id} | "
        f"checked={checked} | "
        f"triggered={triggered}"
    )

    return final_result


def check_all_users_price_alerts() -> Dict[str, Any]:
    db = get_db()

    users = db.execute(
        "SELECT id FROM users;"
    ).fetchall()

    summary = {
        "ok": True,
        "usersChecked": 0,
        "alertsChecked": 0,
        "alertsTriggered": 0,
        "results": [],
    }

    print(f"SCHEDULER START | total_users={len(users)}")

    for user in users:
        result = check_user_price_alerts(user["id"])
        summary["usersChecked"] += 1
        summary["alertsChecked"] += int(result.get("checked", 0))
        summary["alertsTriggered"] += int(result.get("triggered", 0))
        summary["results"].append({
            "userId": user["id"],
            "result": result,
        })

    print(
        "SCHEDULER COMPLETE | "
        f"users={summary['usersChecked']} | "
        f"checked={summary['alertsChecked']} | "
        f"triggered={summary['alertsTriggered']}"
    )

    return summary