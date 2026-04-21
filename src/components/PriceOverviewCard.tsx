import { useState } from "react";
import Card from "./Card";

type Props = {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  updatedAt: string;
  marketStatus: "Open" | "After Hours" | "Closed";
  atCloseUpdatedAt?: string | null;
  extendedLabel?: "After Hours" | "Overnight" | "Pre-Market" | null;
  extendedPrice?: number | null;
  extendedChange?: number | null;
  extendedChangePct?: number | null;
  extendedUpdatedAt?: string | null;
};

function formatEtTime(isoString?: string | null): string {
  if (!isoString) return "N/A";

  const date = new Date(isoString);

  let userTimeZone = "America/New_York";

  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user.timeZone) {
        userTimeZone = user.timeZone;
      }
    } catch {}
  }

  const timeText = new Intl.DateTimeFormat("en-US", {
    timeZone: userTimeZone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);

  const zoneText =
    new Intl.DateTimeFormat("en-US", {
      timeZone: userTimeZone,
      timeZoneName: "short",
    })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value ?? "";

  return `${timeText} ${zoneText}`;
}

function formatUpdatedAt(isoString: string): string {
  const date = new Date(isoString);

  let userTimeZone = "America/New_York";

  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user.timeZone) {
        userTimeZone = user.timeZone;
      }
    } catch {}
  }

  const dateText = new Intl.DateTimeFormat("en-US", {
    timeZone: userTimeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);

  const zoneText =
    new Intl.DateTimeFormat("en-US", {
      timeZone: userTimeZone,
      timeZoneName: "short",
    })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value ?? "";

  return `${dateText} ${zoneText}`;
}

export default function PriceOverviewCard(props: Props) {
  const [showInfo, setShowInfo] = useState(false);

  const regularUp = props.change >= 0;
  const regularColor = regularUp ? "var(--green)" : "var(--red)";
  const regularSign = regularUp ? "+" : "";

  const hasExtendedData =
    props.extendedLabel != null &&
    props.extendedPrice != null &&
    props.extendedChange != null &&
    props.extendedChangePct != null &&
    props.extendedUpdatedAt != null;

  const extendedUp = (props.extendedChange ?? 0) >= 0;
  const extendedColor = extendedUp ? "var(--green)" : "var(--red)";
  const extendedSign = extendedUp ? "+" : "";

  const tooltipText =
    props.extendedLabel === "After Hours"
      ? "This price reflects extended-hours trading data returned by the available market feed."
      : props.extendedLabel === "Pre-Market"
      ? "This price reflects pre-market trading data returned by the available market feed."
      : props.extendedLabel === "Overnight"
      ? "This price reflects overnight trading data returned by the available market feed."
      : "";

  const regularTimeLabel =
    props.marketStatus === "Open"
      ? "Last updated"
      : props.marketStatus === "Closed" && props.atCloseUpdatedAt
      ? "At close"
      : "Last updated";

  const regularTimeValue =
    props.marketStatus === "Closed" && props.atCloseUpdatedAt
      ? props.atCloseUpdatedAt
      : props.updatedAt;

  return (
    <Card
      title={`${props.ticker}  ${props.name}`}
      right={
        <span className="badge">
          Updated {formatUpdatedAt(props.updatedAt)}
        </span>
      }
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 20,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 36,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 34, fontWeight: 900 }}>
                ${props.price.toFixed(2)}
              </div>

              <div
                style={{
                  color: regularColor,
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {regularSign}
                {props.change.toFixed(2)} ({regularSign}
                {props.changePct.toFixed(2)}%)
              </div>

              <div
                style={{
                  marginTop: 8,
                  color: "var(--muted)",
                  fontSize: 13,
                }}
              >
                {regularTimeLabel}: {formatEtTime(regularTimeValue)}
              </div>
            </div>

            {hasExtendedData && (
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: 34, fontWeight: 900 }}>
                  ${props.extendedPrice!.toFixed(2)}
                </div>

                <div
                  style={{
                    color: extendedColor,
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {extendedSign}
                  {props.extendedChange!.toFixed(2)} ({extendedSign}
                  {props.extendedChangePct!.toFixed(2)}%)
                </div>

                <div
                  style={{
                    marginTop: 8,
                    color: "var(--muted)",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    position: "relative",
                  }}
                >
                  <span>
                    {props.extendedLabel}: {formatEtTime(props.extendedUpdatedAt)}
                  </span>

                  <button
                    type="button"
                    onClick={() => setShowInfo((prev) => !prev)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--text)",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 700,
                      lineHeight: 1,
                      padding: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label="Show extended-hours information"
                    title="Extended-hours information"
                  >
                    i
                  </button>

                  {showInfo && tooltipText && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 12px)",
                        left: 120,
                        width: 360,
                        padding: "16px 18px",
                        background: "#121821",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 14,
                        boxShadow: "0 14px 34px rgba(0,0,0,0.45)",
                        color: "#e8edf5",
                        zIndex: 50,
                        lineHeight: 1.5,
                        fontSize: 14,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: -8,
                          left: 28,
                          width: 14,
                          height: 14,
                          background: "#121821",
                          borderLeft: "1px solid rgba(255,255,255,0.08)",
                          borderTop: "1px solid rgba(255,255,255,0.08)",
                          transform: "rotate(45deg)",
                        }}
                      />
                      {tooltipText}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <span className="badge">Market {props.marketStatus}</span>
      </div>
    </Card>
  );
}