import os
import smtplib
from email.message import EmailMessage
from typing import Dict, Any, Tuple


def send_email_notification(to_email: str, subject: str, body: str) -> Dict[str, Any]:
    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587").strip() or "587")
    smtp_username = os.getenv("SMTP_USERNAME", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    smtp_from = os.getenv("SMTP_FROM", "").strip() or smtp_username

    if not smtp_host or not smtp_from:
        print(f"EMAIL NOT SENT | to={to_email} | reason=SMTP is not configured")
        return {
            "ok": False,
            "channel": "email",
            "message": "SMTP is not configured.",
        }

    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = smtp_from
        msg["To"] = to_email
        msg.set_content(body)

        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.starttls()
            if smtp_username and smtp_password:
                server.login(smtp_username, smtp_password)
            server.send_message(msg)

        print(f"EMAIL SENT | to={to_email} | subject={subject}")
        return {
            "ok": True,
            "channel": "email",
            "message": "Email sent.",
        }
    except Exception as e:
        print(f"EMAIL FAILED | to={to_email} | error={e}")
        return {
            "ok": False,
            "channel": "email",
            "message": str(e),
        }


def build_alert_email(
    alert_type: str,
    ticker: str,
    details: Dict[str, Any],
    footer_message: str | None = None,
) -> Tuple[str, str]:
    clean_alert_type = (alert_type or "Alert").strip()
    clean_ticker = (ticker or "").strip().upper()

    subject = f"{clean_alert_type}: {clean_ticker}" if clean_ticker else clean_alert_type

    lines = [
        "Financial Market Analytics Alert",
        "",
        f"Alert Type: {clean_alert_type}",
    ]

    if clean_ticker:
        lines.append(f"Ticker: {clean_ticker}")

    for key, value in details.items():
        if value is None or value == "":
            continue

        label = str(key).replace("_", " ").strip().title()
        lines.append(f"{label}: {value}")

    lines.append("")
    lines.append(
        footer_message
        or "This notification was sent because an alert condition matched your selected preferences."
    )

    body = "\n".join(lines)
    return subject, body


def send_sms_notification(phone: str, body: str) -> Dict[str, Any]:
    print(f"SMS NOT SENT | to={phone} | reason=SMS provider is not configured yet")
    return {
        "ok": False,
        "channel": "sms",
        "message": "SMS provider is not configured yet.",
    }


def send_push_notification(user_id: int, title: str, body: str) -> Dict[str, Any]:
    print(f"PUSH NOT SENT | user_id={user_id} | reason=Push provider is not configured yet")
    return {
        "ok": False,
        "channel": "push",
        "message": "Push provider is not configured yet.",
    }