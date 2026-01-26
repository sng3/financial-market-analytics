import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Home.css";

export default function Home() {
  const [symbol, setSymbol] = useState("");
  const navigate = useNavigate();

  const go = () => {
    const s = symbol.trim().toUpperCase();
    if (!s) return;
    navigate(`/stock/${s}`);
  };

  return (
    <div className="home">
      <h1 className="pageTitle">Home</h1>
      <p className="muted">
        Search a stock symbol to view real-time data, charts, sentiment, and predictions.
      </p>

      <div className="searchCard">
        <label className="label">Stock Symbol</label>
        <div className="row">
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="e.g., AAPL"
            className="input"
          />
          <button onClick={go} className="btn">
            Search
          </button>
        </div>
      </div>

      <div className="infoGrid">
        <div className="infoBox">
          <h3>What you get</h3>
          <ul>
            <li>Real-time price + change</li>
            <li>Historical chart</li>
            <li>Sentiment from news</li>
            <li>AI/ML prediction (planned)</li>
          </ul>
        </div>

        <div className="infoBox">
          <h3>Beginner friendly</h3>
          <ul>
            <li>Simple signals</li>
            <li>Risk profile recommendations</li>
            <li>Short explanations per panel</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
