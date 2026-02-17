import React, { useState } from "react";
import Card from "./Card";
import InfoDialog from "./InfoDialog";

type Props = {
  rsi: number;
  smaTrend: "Up" | "Down" | "Flat";
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

export default function TechnicalIndicatorsCard({ rsi, smaTrend }: Props) {
  const [infoOpen, setInfoOpen] = useState(false);

  const status = rsi >= 70 ? "Overbought" : rsi <= 30 ? "Oversold" : "Neutral";

  const smaLabel =
    smaTrend === "Up" ? "Uptrend" : smaTrend === "Down" ? "Downtrend" : "Flat";

  return (
    <>
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>Technical Indicators</span>
            <InfoButton onClick={() => setInfoOpen(true)} />
          </div>
        }
      >
        <div style={{ display: "grid", gap: 16 }}>
          {/* RSI row */}
          <div className="rowWrap" style={{ justifyContent: "space-between" }}>
            <div style={{ color: "var(--muted)" }}>RSI (14)</div>
            <div style={{ fontWeight: 800 }}>
              {rsi.toFixed(0)} <span className="badge">{status}</span>
            </div>
          </div>

          {/* SMA row */}
          <div className="rowWrap" style={{ justifyContent: "space-between" }}>
            <div style={{ color: "var(--muted)" }}>SMA Trend</div>
            <div style={{ fontWeight: 800 }}>{smaLabel}</div>
          </div>
        </div>
      </Card>

      <InfoDialog
        open={infoOpen}
        title="What do RSI and SMA mean?"
        onClose={() => setInfoOpen(false)}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <b>RSI (Relative Strength Index)</b> is a momentum indicator that measures
            how strong recent price movements are on a scale from 0 to 100.
          </div>

          <div>
            Typical interpretation: RSI ≥ <b>70</b> may suggest overbought conditions,
            RSI ≤ <b>30</b> may suggest oversold conditions.
          </div>

          <div>
            <b>SMA (Simple Moving Average)</b> is the average price over a defined
            time period. It helps smooth price data to identify overall trend direction.
          </div>

          <div>
            When price or a shorter SMA is above a longer SMA, it may suggest an
            uptrend. Below may suggest a downtrend. Similar values may indicate a flat trend.
          </div>

          <div>
            These indicators are educational tools and should not be used alone
            to make investment decisions.
          </div>
        </div>
      </InfoDialog>
    </>
  );
}