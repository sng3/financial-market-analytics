import React from "react";
import { useNavigate } from "react-router-dom";
import StockSearchBar from "../components/StockSearchBar";
import Card from "../components/Card";

export default function LandingPage() {
  const nav = useNavigate();

  return (
    <div className="container">
      <div style={{ padding: "28px 0 10px" }}>
        <div style={{ fontSize: 36, fontWeight: 950, letterSpacing: -0.5 }}>
          Understand the Market. Invest with Confidence.
        </div>
        <div style={{ color: "var(--muted)", marginTop: 8, maxWidth: 760 }}>
          Learn-2-Invest combines real-time data, charts, sentiment, and AI insights in one beginner-friendly dashboard.
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <StockSearchBar
          onSearch={(q) => {
            if (!q) return;
            nav(`/dashboard?t=${encodeURIComponent(q)}`);
          }}
        />
      </div>

      <div className="grid2equal" style={{ marginTop: 16 }}>
        <Card title="Real-time Market Data">
          <div style={{ color: "var(--muted)" }}>Fast price updates and historical charts in one place.</div>
        </Card>
        <Card title="Learn as You Explore">
          <div style={{ color: "var(--muted)" }}>Risk profiles and short explanations help beginners build confidence.</div>
        </Card>
      </div>

      <div style={{ marginTop: 14, color: "var(--muted2)", fontSize: 13 }}>
        Educational use only. Not financial advice.
      </div>
    </div>
  );
}