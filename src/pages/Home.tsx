import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Home() {
  const [symbol, setSymbol] = useState("");
  const navigate = useNavigate();

  const handleGo = () => {
    const trimmed = symbol.trim().toUpperCase();
    if (!trimmed) return;
    navigate(`/stock/${trimmed}`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Home</h2>
      <p>Search a stock symbol to view details.</p>

      <div style={{ display: "flex", gap: "8px", maxWidth: "360px" }}>
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="e.g., AAPL"
          style={{ flex: 1, padding: "8px" }}
        />
        <button onClick={handleGo} style={{ padding: "8px 12px" }}>
          Search
        </button>
      </div>
    </div>
  );
}
