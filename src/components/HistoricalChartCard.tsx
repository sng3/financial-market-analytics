import React, { useMemo, useState } from "react";
import Card from "./Card";

type Props = {
  // For now, just placeholder data
  series: { t: string; v: number }[];
};

const ranges = ["1D", "5D", "1M", "6M", "1Y", "Max"] as const;

export default function HistoricalChartCard({ series }: Props) {
  const [range, setRange] = useState<(typeof ranges)[number]>("1Y");
  const [showSMA, setShowSMA] = useState(true);
  const [showRSI, setShowRSI] = useState(false);

  // Placeholder: you will later slice series based on range
  const view = useMemo(() => series.slice(-40), [series]);

  return (
    <Card
      title="Historical Price Chart"
      right={
        <div className="rowWrap">
          {ranges.map((r) => (
            <button
              key={r}
              className="btn"
              style={{
                padding: "6px 10px",
                borderColor: r === range ? "rgba(74,144,226,0.6)" : "var(--border)",
                background: r === range ? "rgba(74,144,226,0.12)" : "rgba(255,255,255,0.02)",
              }}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      }
    >
      <div style={{ height: 260, border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 14, display: "grid", placeItems: "center", color: "var(--muted)" }}>
        Chart placeholder (connect Chart.js here)
        <div style={{ fontSize: 12, marginTop: 6 }}>
          Points: {view.length} | Range: {range}
        </div>
      </div>

      <div className="rowWrap" style={{ marginTop: 12 }}>
        <label className="row" style={{ color: "var(--muted)" }}>
          <input type="checkbox" checked={showSMA} onChange={(e) => setShowSMA(e.target.checked)} />
          SMA
        </label>
        <label className="row" style={{ color: "var(--muted)" }}>
          <input type="checkbox" checked={showRSI} onChange={(e) => setShowRSI(e.target.checked)} />
          RSI
        </label>
      </div>
    </Card>
  );
}