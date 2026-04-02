from flask import Flask
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler

from .db import init_db, close_db
from .routes import stocks_bp, watchlists_bp, alerts_bp
from .routes.auth import bp as auth_bp

from app.services.alert_check_service import check_all_users_price_alerts
from app.services.news_alert_service import check_all_users_news_alerts

import os

# keep scheduler global so it doesn’t start multiple times
_scheduler = None


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # =========================
    # Register routes
    # =========================
    app.register_blueprint(stocks_bp)
    app.register_blueprint(watchlists_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(auth_bp)

    # =========================
    # Health check
    # =========================
    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    # =========================
    # DB setup
    # =========================
    app.teardown_appcontext(close_db)

    with app.app_context():
        init_db()

    # =========================
    # START ALERT SCHEDULER
    # =========================
    global _scheduler
    if _scheduler is None and os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        _scheduler = BackgroundScheduler(daemon=True)

        def run_alert_checks():
            with app.app_context():
                try:
                    price_result = check_all_users_price_alerts()
                    print(
                        "🔔 Price alert scheduler:",
                        f"users={price_result['usersChecked']}, "
                        f"checked={price_result['alertsChecked']}, "
                        f"triggered={price_result['alertsTriggered']}"
                    )
                except Exception as e:
                    print("❌ Price scheduler error:", e)

                try:
                    news_result = check_all_users_news_alerts()
                    print(
                        "📰 News alert scheduler:",
                        f"users={news_result['usersChecked']}, "
                        f"checked={news_result['tickersChecked']}, "
                        f"triggered={news_result['alertsTriggered']}"
                    )
                except Exception as e:
                    print("❌ News scheduler error:", e)

        # run every 60 seconds
        _scheduler.add_job(
            run_alert_checks,
            trigger="interval",
            seconds=60,
            id="alert_checker",
            replace_existing=True,
        )

        _scheduler.start()
        print("🚀 Alert scheduler started (runs every 60s)")

    return app