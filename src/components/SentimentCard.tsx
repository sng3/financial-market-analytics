import React from "react";
import Card from "./Card";

type Props = {
  label: "Positive" | "Neutral" | "Negative";
  score: number;
  headlines: string[];
};

export default function SentimentCard({ label, score, headlines }: Props) {
  return (
    <Card title="Market Sentiment">
      <div className="rowWrap" style={{ justifyContent: "space-between" }}>
        <div style={{ fontWeight: 800 }}>
          Overall: {label} <span className="badge">Score {score.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
        {headlines.slice(0, 3).map((h, idx) => (
          <div key={idx} style={{ color: "var(--muted)" }}>
            • {h}
          </div>
        ))}
      </div>
    </Card>
  );
}