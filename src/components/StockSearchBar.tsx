import React, { useEffect, useState } from "react";
import { searchStocks, type SearchResult } from "../services/api";

type Props = {
  onSelectTicker: (ticker: string) => void;
};

export default function StockSearchBar({ onSelectTicker }: Props) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const run = async () => {
      const query = q.trim();
      if (query.length < 2) {
        setItems([]);
        return;
      }
      try {
        const res = await searchStocks(query);
        setItems(res);
      } catch {
        setItems([]);
      }
    };

    const t = setTimeout(run, 250);
    return () => clearTimeout(t);
  }, [q]);

  const select = (ticker: string) => {
    onSelectTicker(ticker);
    setOpen(false);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div className="row" style={{ width: "100%" }}>
        <input
          className="input"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          placeholder="Search ticker or company name (e.g., NVDA or NVIDIA)"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // If user hits enter, pick first suggestion if exists
              if (items.length > 0) select(items[0].ticker);
              else if (q.trim()) select(q.trim().toUpperCase());
            }
          }}
        />
        <button
          className="btn btnPrimary"
          onClick={() => {
            if (items.length > 0) select(items[0].ticker);
            else if (q.trim()) select(q.trim().toUpperCase());
          }}
        >
          Search
        </button>
      </div>

      {open && items.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            zIndex: 20,
            boxShadow: "var(--shadow)",
          }}
        >
          {items.map((it) => (
            <button
              key={it.ticker}
              onClick={() => select(it.ticker)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                background: "transparent",
                border: "none",
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 800 }}>{it.ticker}</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>{it.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}