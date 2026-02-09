import React from "react";
import Card from "./Card";

type Item = { ticker: string; price: number; changePct: number };

type Props = {
  items: Item[];
  onView: (ticker: string) => void;
  onRemove: (ticker: string) => void;
};

export default function WatchlistTable({ items, onView, onRemove }: Props) {
  return (
    <Card title="Your Watchlist">
      {items.length === 0 ? (
        <div style={{ color: "var(--muted)" }}>No stocks in your watchlist yet.</div>
      ) : (
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "var(--muted2)", textAlign: "left" }}>
                <th style={{ padding: "10px 6px" }}>Ticker</th>
                <th style={{ padding: "10px 6px" }}>Price</th>
                <th style={{ padding: "10px 6px" }}>Change</th>
                <th style={{ padding: "10px 6px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const up = it.changePct >= 0;
                return (
                  <tr key={it.ticker} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 6px", fontWeight: 800 }}>{it.ticker}</td>
                    <td style={{ padding: "10px 6px" }}>${it.price.toFixed(2)}</td>
                    <td style={{ padding: "10px 6px", color: up ? "var(--green)" : "var(--red)" }}>
                      {up ? "+" : ""}{it.changePct.toFixed(2)}%
                    </td>
                    <td style={{ padding: "10px 6px" }}>
                      <div className="rowWrap">
                        <button className="btn" onClick={() => onView(it.ticker)}>View</button>
                        <button className="btn btnDanger" onClick={() => onRemove(it.ticker)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}