import React from "react";
import Card from "./Card";

type Props = {
  horizon: string; // "7 days"
  trend: "Up" | "Down" | "Stable";
  confidence: number; // 0-100
};

export default function PredictionCard({ horizon, trend, confidence }: Props) {
  return (
    <Card title="AI / ML Prediction">
      <div className="rowWrap" style={{ justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>
            {horizon} Trend: {trend}
          </div>
          <div style={{ color: "var(--muted)" }}>
            Confidence: {confidence.toFixed(0)}%
          </div>
        </div>
        <span className="badge">Educational</span>
      </div>

      <div style={{ marginTop: 10, color: "var(--muted2)", fontSize: 13, lineHeight: 1.45 }}>
        Disclaimer: This prediction is for educational purposes only and is not financial advice. All investment decisions are made at your own risk.
      </div>
    </Card>
  );
}