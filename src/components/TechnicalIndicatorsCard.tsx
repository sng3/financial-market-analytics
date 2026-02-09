import React from "react";
import Card from "./Card";

type Props = {
  rsi: number;
  smaTrend: "Up" | "Down" | "Flat";
};

export default function TechnicalIndicatorsCard({ rsi, smaTrend }: Props) {
  const status =
    rsi >= 70 ? "Overbought" : rsi <= 30 ? "Oversold" : "Neutral";

  return (
    <Card title="Technical Indicators">
      <div style={{ display: "grid", gap: 10 }}>
        <div className="rowWrap" style={{ justifyContent: "space-between" }}>
          <div style={{ color: "var(--muted)" }}>RSI</div>
          <div style={{ fontWeight: 800 }}>{rsi.toFixed(0)} <span className="badge">{status}</span></div>
        </div>

        <div className="rowWrap" style={{ justifyContent: "space-between" }}>
          <div style={{ color: "var(--muted)" }}>SMA Trend</div>
          <div style={{ fontWeight: 800 }}>{smaTrend}</div>
        </div>

        <div style={{ color: "var(--muted2)", fontSize: 13, lineHeight: 1.45 }}>
          Tip: RSI above 70 may indicate overbought conditions; below 30 may indicate oversold conditions.
        </div>
      </div>
    </Card>
  );
}