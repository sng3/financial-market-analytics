from flask import Flask
from flask_cors import CORS

from app.db import init_db, close_db
from app.routes import stocks_bp, watchlists_bp

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.register_blueprint(stocks_bp)
app.register_blueprint(watchlists_bp)

@app.get("/api/health")
def health():
    return {"status": "ok"}

app.teardown_appcontext(close_db)

with app.app_context():
    init_db()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
