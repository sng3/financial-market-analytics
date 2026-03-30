import React from "react";

export type RiskProfile = "Conservative" | "Moderate" | "Aggressive";

type Props = {
  risk: RiskProfile;
  onChangeRisk: (risk: RiskProfile) => void;
};

export default function RiskRecommendationCard({ risk, onChangeRisk }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <label
        htmlFor="risk-profile"
        style={{
          fontSize: 12,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "var(--muted2)",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        Risk Profile
      </label>

      <select
        id="risk-profile"
        className="input"
        value={risk}
        onChange={(e) => onChangeRisk(e.target.value as RiskProfile)}
        style={{
          width: 170,
          padding: "8px 12px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.03)",
          color: "var(--text)",
          border: "1px solid var(--border)",
          fontWeight: 600,
        }}
      >
        <option value="Conservative">Conservative</option>
        <option value="Moderate">Moderate</option>
        <option value="Aggressive">Aggressive</option>
      </select>
    </div>
  );
}