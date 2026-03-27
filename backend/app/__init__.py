from flask import Flask
from flask_cors import CORS
from .db import init_db, close_db
from .routes import stocks_bp, watchlists_bp, alerts_bp
from .routes.auth import bp as auth_bp

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(stocks_bp)
    app.register_blueprint(watchlists_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(auth_bp)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    app.teardown_appcontext(close_db)

    with app.app_context():
        init_db()

    return app