from flask import Flask
from flask_cors import CORS
from .db import init_db

def create_app():
    app = Flask(__name__)
    CORS(app)

    init_db()

    from .routes.market_routes import bp as market_bp
    app.register_blueprint(market_bp, url_prefix="/api")

    return app
