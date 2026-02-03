import os
import time
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})

@app.get("/api/stocks/quote")
def quote():
    """
    TEMP: returns a stub quote so we can verify frontend ↔ backend works.
    Next step: swap this stub with robin_stocks provider + login.
    """
    ticker = (request.args.get("ticker") or "").strip().upper()
    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    # Stub response for now
    return jsonify({
        "ticker": ticker,
        "price": 180.25,
        "change": 1.32,
        "changePercent": 0.74,
        "timestamp": int(time.time())
    })

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
