import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import WatchlistTable from "../components/WatchlistTable";

export default function WatchlistPage() {
  const nav = useNavigate();
  const [items, setItems] = useState([
    { ticker: "AAPL", price: 182.45, changePct: 1.18 },
    { ticker: "TSLA", price: 248.12, changePct: -0.87 },
    { ticker: "MSFT", price: 403.21, changePct: 0.42 },
  ]);

  return (
    <div className="container">
      <div className="pageTitle">Watchlist</div>
      <WatchlistTable
        items={items}
        onView={(t) => nav(`/dashboard?t=${encodeURIComponent(t)}`)}
        onRemove={(t) => setItems((prev) => prev.filter((x) => x.ticker !== t))}
      />
    </div>
  );
}