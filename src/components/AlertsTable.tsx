import React, { useState } from "react";
import Card from "./Card";

type Alert = {
  id: string;
  ticker: string;
  condition: "Above" | "Below";
  price: number;
  status: "Active" | "Triggered";
  createdAt: string;
};

type Props = {
  alerts: Alert[];
  onCreate: (a: Omit<Alert, "id" | "status" | "createdAt">) => void;
};

export default function AlertsTable({ alerts, onCreate }: Props) {
  const [ticker, setTicker] = useState("AAPL");
  const [condition, setCondition] = useState<"Above" | "Below">("Above");
  const [price, setPrice] = useState<number>(190);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card title="Create New Alert">
        <div className="grid2equal">
          <div>
            <div style={{ color: "var(--muted2)", fontSize: 12, marginBottom: 6 }}>Ticker</div>
            <input className="input" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} />
          </div>

          <div>
            <div style={{ color: "var(--muted2)", fontSize: 12, marginBottom: 6 }}>Condition</div>
            <select
              className="input"
              value={condition}
              onChange={(e) => setCondition(e.target.value as "Above" | "Below")}
            >
              <option value="Above">Above</option>
              <option value="Below">Below</option>
            </select>
          </div>

          <div>
            <div style={{ color: "var(--muted2)", fontSize: 12, marginBottom: 6 }}>Price</div>
            <input
              className="input"
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              className="btn btnPrimary"
              style={{ width: "100%" }}
              onClick={() => onCreate({ ticker, condition, price })}
            >
              Create Alert
            </button>
          </div>
        </div>
      </Card>

      <Card title="Alerts">
        {alerts.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>No alerts yet.</div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "var(--muted2)", textAlign: "left" }}>
                  <th style={{ padding: "10px 6px" }}>Stock</th>
                  <th style={{ padding: "10px 6px" }}>Condition</th>
                  <th style={{ padding: "10px 6px" }}>Status</th>
                  <th style={{ padding: "10px 6px" }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 6px", fontWeight: 800 }}>{a.ticker}</td>
                    <td style={{ padding: "10px 6px" }}>
                      {a.condition} ${a.price.toFixed(2)}
                    </td>
                    <td style={{ padding: "10px 6px" }}>
                      <span className="badge" style={{ color: a.status === "Triggered" ? "var(--green)" : "var(--muted)" }}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 6px", color: "var(--muted)" }}>{a.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}