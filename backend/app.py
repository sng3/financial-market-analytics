from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf

app = Flask(__name__)
CORS(app)

@app.get("/api/search")
def search():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify([])

    # If user typed a ticker-like input, return it immediately
    if len(q) <= 6 and q.replace(".", "").replace("-", "").isalnum():
        return jsonify([{"ticker": q.upper(), "name": q.upper()}])

    # Use yfinance search (works for company names)
    results = yf.Search(q, max_results=8).quotes

    out = []
    for r in results:
        sym = r.get("symbol")
        name = r.get("shortname") or r.get("longname") or sym
        if sym:
            out.append({"ticker": sym, "name": name})
    return jsonify(out)

@app.get("/api/stock")
def get_stock():
    ticker = request.args.get("ticker", "").upper().strip()
    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    t = yf.Ticker(ticker)
    hist = t.history(period="2d", interval="1d")

    if hist.empty or len(hist) < 2:
        return jsonify({"error": f"no data for {ticker}"}), 404

    prev_close = float(hist["Close"].iloc[-2])
    price = float(hist["Close"].iloc[-1])

    change = price - prev_close
    change_pct = (change / prev_close) * 100 if prev_close != 0 else 0.0

    name = None
    try:
        name = t.info.get("shortName") or t.info.get("longName")
    except Exception:
        name = None

    return jsonify({
        "ticker": ticker,
        "name": name or ticker,
        "price": price,
        "prevClose": prev_close,
        "change": change,
        "changePct": change_pct,
        "updatedAt": "now"
    })

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)