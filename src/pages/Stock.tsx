import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getStockOverview } from "../services/api";
import type { StockOverview } from "../services/api";

import PricePanel from "../components/stock/PricePanel";
import ChartPanel from "../components/stock/ChartPanel";
import TechnicalPanel from "../components/stock/TechnicalPanel";
import PredictionPanel from "../components/stock/PredictionPanel";
import SentimentPanel from "../components/stock/SentimentPanel";
import RecommendationPanel from "../components/stock/RecommendationPanel";

import "./Stock.css";

export default function Stock() {
  const { symbol } = useParams();
  const [data, setData] = useState<StockOverview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!symbol) return;

    setError("");
    setData(null);

    getStockOverview(symbol)
      .then(setData)
      .catch(() => setError("Failed to load stock data."));
  }, [symbol]);

  return (
    <div>
      <h1 className="pageTitle">Stock: {symbol?.toUpperCase()}</h1>
      <p className="muted">All analytics for the selected stock are shown below.</p>

      {error ? (
        <p className="error">{error}</p>
      ) : !data ? (
        <p className="muted">Loading...</p>
      ) : (
        <div className="stockGrid">
          <div className="span2">
            <div className="topRow">
              <PricePanel overview={data} />
              <ChartPanel symbol={data.symbol} />
            </div>
          </div>

          <TechnicalPanel symbol={data.symbol} />
          <PredictionPanel symbol={data.symbol} />
          <SentimentPanel symbol={data.symbol} />
          <RecommendationPanel symbol={data.symbol} />
        </div>
      )}
    </div>
  );
}
