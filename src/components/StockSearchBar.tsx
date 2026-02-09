import React, { useState } from "react";

type Props = {
  onSearch: (query: string) => void;
  placeholder?: string;
};

export default function StockSearchBar({ onSearch, placeholder }: Props) {
  const [q, setQ] = useState("");

  return (
    <div className="row" style={{ width: "100%" }}>
      <input
        className="input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder ?? "Search stock ticker or company name (e.g., AAPL)"}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSearch(q.trim());
        }}
      />
      <button className="btn btnPrimary" onClick={() => onSearch(q.trim())}>
        Search
      </button>
    </div>
  );
}