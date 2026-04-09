import { useState } from "react";
import type { RiskProfile } from "./RiskRecommendationCard";
import Card from "./Card";
import InfoDialog from "./InfoDialog";

type Props = {
  horizon: string;
  trend: "Up" | "Down" | "Stable";
  confidence: number;
  sentimentLabel?: string;
  sentimentScore?: number;
  explanation?: string;
  riskMessage?: string;
  risk: RiskProfile;
  onChangeRisk: (risk: RiskProfile) => void;
  interpretation?: string;
  suggestedAction?: "Opportunity" | "Watchlist" | "Caution";
  actionReason?: string;
};

function InfoButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      aria-label="Info"
      title="Info"
      style={{
        width: 22,
        height: 22,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(255,255,255,0.05)",
        color: "rgba(255,255,255,0.80)",
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
      }}
    >
      i
    </button>
  );
}

function getTrendStyles(trend: Props["trend"]) {
  switch (trend) {
    case "Up":
      return {
        accent: "var(--green)",
        softBg: "rgba(34,197,94,0.10)",
        softBorder: "rgba(34,197,94,0.30)",
        text: "var(--green)",
      };
    case "Down":
      return {
        accent: "var(--red)",
        softBg: "rgba(239,68,68,0.10)",
        softBorder: "rgba(239,68,68,0.30)",
        text: "var(--red)",
      };
    default:
      return {
        accent: "#cbd5e1",
        softBg: "rgba(148,163,184,0.10)",
        softBorder: "rgba(148,163,184,0.24)",
        text: "#cbd5e1",
      };
  }
}

function getActionStyles(action?: "Opportunity" | "Watchlist" | "Caution") {
  switch (action) {
    case "Opportunity":
      return {
        color: "var(--green)",
        background: "rgba(34,197,94,0.10)",
        border: "1px solid rgba(34,197,94,0.30)",
      };
    case "Caution":
      return {
        color: "var(--red)",
        background: "rgba(239,68,68,0.10)",
        border: "1px solid rgba(239,68,68,0.30)",
      };
    default:
      return {
        color: "var(--blue)",
        background: "rgba(74,144,226,0.10)",
        border: "1px solid rgba(74,144,226,0.30)",
      };
  }
}

function signalChip(label: string, value: string, borderColor: string) {
  return (
    <div
      style={{
        border: `1px solid ${borderColor}`,
        background: "rgba(255,255,255,0.02)",
        borderRadius: 10,
        padding: "8px 10px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "var(--muted2)",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text)",
          fontWeight: 700,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function segmentedButton(
  value: RiskProfile,
  current: RiskProfile,
  onChangeRisk: (risk: RiskProfile) => void
) {
  const active = value === current;

  return (
    <button
      type="button"
      onClick={() => onChangeRisk(value)}
      style={{
        border: "none",
        background: active ? "rgba(74,144,226,0.18)" : "transparent",
        color: active ? "var(--text)" : "var(--muted)",
        padding: "7px 12px",
        borderRadius: 10,
        fontWeight: active ? 800 : 600,
        fontSize: 13,
        cursor: "pointer",
        transition: "all 180ms ease",
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </button>
  );
}

export default function PredictionCard({
  horizon,
  trend,
  confidence,
  sentimentLabel,
  sentimentScore,
  explanation,
  riskMessage,
  risk,
  onChangeRisk,
  interpretation,
  suggestedAction,
  actionReason,
}: Props) {
  const [infoOpen, setInfoOpen] = useState(false);

  const styles = getTrendStyles(trend);
  const actionStyles = getActionStyles(suggestedAction);
  const confidenceSafe = Math.max(0, Math.min(100, confidence));

  return (
    <>
      <Card
        title={
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 14,
              width: "100%",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span>AI / ML Prediction</span>
              <InfoButton onClick={() => setInfoOpen(true)} />
              <span className="badge">Educational</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "var(--muted2)",
                  fontWeight: 700,
                }}
              >
                Risk
              </span>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: 4,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
                  gap: 2,
                }}
              >
                {segmentedButton("Conservative", risk, onChangeRisk)}
                {segmentedButton("Moderate", risk, onChangeRisk)}
                {segmentedButton("Aggressive", risk, onChangeRisk)}
              </div>
            </div>
          </div>
        }
      >
        <div
          style={{
            borderRadius: 14,
            border: `1px solid ${styles.softBorder}`,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)",
            padding: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "var(--muted2)",
                  marginBottom: 6,
                }}
              >
                Forecast Horizon
              </div>

              <div style={{ fontWeight: 900, fontSize: 18, lineHeight: 1.2 }}>
                {horizon} Trend:{" "}
                <span style={{ color: styles.text }}>{trend}</span>
              </div>
            </div>

            <div
              style={{
                border: `1px solid ${styles.softBorder}`,
                background: styles.softBg,
                color: styles.text,
                borderRadius: 999,
                padding: "7px 12px",
                fontWeight: 800,
                fontSize: 13,
                whiteSpace: "nowrap",
              }}
            >
              Confidence {confidenceSafe.toFixed(0)}%
            </div>
          </div>

          <div
            style={{
              height: 8,
              width: "100%",
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${confidenceSafe}%`,
                borderRadius: 999,
                background: styles.accent,
                transition: "width 260ms ease",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "var(--muted2)",
                marginBottom: 10,
              }}
            >
              Model Signals
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              {signalChip(
                "Sentiment",
                sentimentLabel ?? "Unavailable",
                styles.softBorder
              )}
              {signalChip(
                "Sentiment Score",
                typeof sentimentScore === "number"
                  ? sentimentScore.toFixed(2)
                  : "N/A",
                styles.softBorder
              )}
            </div>
          </div>

          {(interpretation || suggestedAction || actionReason) && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 14,
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "var(--muted2)",
                  marginBottom: 10,
                }}
              >
                AI Interpretation
              </div>

              {interpretation && (
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: 10,
                  }}
                >
                  {interpretation}
                </div>
              )}

              {suggestedAction && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "6px 12px",
                    borderRadius: 999,
                    fontWeight: 800,
                    fontSize: 13,
                    marginBottom: 10,
                    ...actionStyles,
                  }}
                >
                  Suggested Action: {suggestedAction}
                </div>
              )}

              {actionReason && (
                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: 13,
                    lineHeight: 1.65,
                  }}
                >
                  {actionReason}
                </div>
              )}
            </div>
          )}

          {explanation && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 14,
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "var(--muted2)",
                  marginBottom: 8,
                }}
              >
                Rationale
              </div>

              <div
                style={{
                  color: "var(--muted)",
                  fontSize: 13,
                  lineHeight: 1.65,
                }}
              >
                {explanation}
              </div>
            </div>
          )}

          {riskMessage && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 14,
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "var(--muted2)",
                  marginBottom: 8,
                }}
              >
                Risk Profile Interpretation
              </div>

              <div
                style={{
                  color: "var(--muted)",
                  fontSize: 13,
                  lineHeight: 1.65,
                }}
              >
                {riskMessage}
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              color: "var(--muted2)",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            Disclaimer: This prediction is for educational purposes only and is
            not financial advice. All investment decisions are made at your own
            risk.
          </div>
        </div>
      </Card>

      <InfoDialog
        open={infoOpen}
        title="What does the AI / ML Prediction card mean?"
        onClose={() => setInfoOpen(false)}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div>
            This card summarizes what the prediction model thinks may happen
            over the selected forecast period based on market data and sentiment
            signals.
          </div>

          <div>
            <b>Forecast Horizon</b> tells you the time window of the prediction,
            such as 7 days.
          </div>

          <div>
            <b>Trend</b> describes the model’s expected direction:
            <br />
            Up = stronger upward outlook
            <br />
            Down = weaker or bearish outlook
            <br />
            Stable = mixed or neutral outlook
          </div>

          <div>
            <b>Confidence</b> shows how strongly the model supports its current
            prediction. A higher value means the model is more certain relative
            to its alternatives, but it is not a guarantee.
          </div>

          <div>
            <b>Model Signals</b> show some of the inputs used by the model. In
            this dashboard, sentiment and sentiment score help measure whether
            recent news is more positive, neutral, or negative.
          </div>

          <div>
            <b>AI Interpretation</b> is a plain-language summary of what the
            model output means for a beginner user.
          </div>

          <div>
            <b>Suggested Action</b> is not a direct buy or sell command. It is
            an educational signal:
            <br />
            <b>Opportunity</b> = stronger setup worth considering
            <br />
            <b>Watchlist</b> = mixed setup that may need more confirmation
            <br />
            <b>Caution</b> = weaker setup or higher downside risk
          </div>

          <div>
            <b>Rationale</b> explains why the model made its prediction based on
            the available signals.
          </div>

          <div>
            <b>Risk Profile Interpretation</b> adjusts the explanation based on
            whether the selected user profile is Conservative, Moderate, or
            Aggressive.
          </div>

          <div>
            This feature is designed to help users understand model output more
            clearly. It should be used as guidance for learning, not as
            financial advice.
          </div>
        </div>
      </InfoDialog>
    </>
  );
}