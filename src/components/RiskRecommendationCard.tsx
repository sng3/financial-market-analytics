import React, { useMemo, useState } from "react";
import Card from "./Card";

type Risk = "Conservative" | "Moderate" | "Aggressive";

export default function RiskRecommendationCard() {
  const [risk, setRisk] = useState<Risk>("Moderate");

  const content = useMemo(() => {
    switch (risk) {
      case "Conservative":
        return {
          rec: "Consider smaller position sizes and focus on stability and long-term holding.",
          tip: "Conservative investors prioritize lower volatility and steady growth over rapid gains.",
        };
      case "Aggressive":
        return {
          rec: "Higher risk approach: tolerate larger swings; consider strict stop-loss and position limits.",
          tip: "Aggressive profiles accept higher volatility and require clear risk controls.",
        };
      default:
        return {
          rec: "Balanced approach: diversify and use indicators as guidance, not guarantees.",
          tip: "Moderate profiles balance growth and stability with disciplined risk management.",
        };
    }
  }, [risk]);

  const btnFor = (r: Risk) => (
    <button
      className="btn"
      style={{
        borderColor: r === risk ? "rgba(74,144,226,0.6)" : "var(--border)",
        background: r === risk ? "rgba(74,144,226,0.12)" : "rgba(255,255,255,0.02)",
      }}
      onClick={() => setRisk(r)}
    >
      {r}
    </button>
  );

  return (
    <Card title="Your Investment Profile">
      <div className="rowWrap">
        {btnFor("Conservative")}
        {btnFor("Moderate")}
        {btnFor("Aggressive")}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 800 }}>Recommendation</div>
        <div style={{ color: "var(--muted)", marginTop: 6 }}>{content.rec}</div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 800 }}>Educational Tip</div>
        <div style={{ color: "var(--muted)", marginTop: 6 }}>{content.tip}</div>
      </div>
    </Card>
  );
}