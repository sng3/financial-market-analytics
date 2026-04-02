from flask import Flask
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler

from .db import init_db, close_db
from .routes import stocks_bp, watchlists_bp, alerts_bp
from .routes.auth import bp as auth_bp

from app.services.alert_check_service import check_all_users_price_alerts

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
    if _scheduler is None:
        _scheduler = BackgroundScheduler(daemon=True)

        def run_alert_checks():
            with app.app_context():
                try:
                    result = check_all_users_price_alerts()
                    print(
                        "🔔 Alert scheduler:",
                        f"users={result['usersChecked']}, "
                        f"checked={result['alertsChecked']}, "
                        f"triggered={result['alertsTriggered']}"
                    )
                except Exception as e:
                    print("❌ Scheduler error:", e)

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