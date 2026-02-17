import React, { useEffect, useMemo, useState } from "react";
import Card from "./Card";
import InfoDialog from "./InfoDialog";

type Item = {
  title: string;
  url: string;
  imageUrl: string;
  publisher?: string;
  publishedAt?: string | null;
  score?: number;
};

type Health = {
  provider: "newsapi" | "yfinance" | "none";
  status: "ok" | "rate_limited" | "error";
  warning: string;
};

type Props = {
  label: "Positive" | "Neutral" | "Negative";
  score: number;
  confidence: number; // 0..1
  items: Item[];
  health: Health;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function fmtTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function chipForScore(s?: number) {
  const v = typeof s === "number" ? s : 0;

  if (v >= 0.15) {
    return {
      text: "Positive",
      bg: "rgba(34,197,94,0.15)",
      bd: "rgba(34,197,94,0.28)",
      fg: "rgba(34,197,94,1)",
    };
  }

  if (v <= -0.15) {
    return {
      text: "Negative",
      bg: "rgba(239,68,68,0.15)",
      bd: "rgba(239,68,68,0.28)",
      fg: "rgba(239,68,68,1)",
    };
  }

  return {
    text: "Neutral",
    bg: "rgba(148,163,184,0.10)",
    bd: "rgba(148,163,184,0.22)",
    fg: "rgba(203,213,225,0.9)",
  };
}

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

export default function SentimentCard({
  label,
  score,
  confidence,
  items,
  health,
}: Props) {
  // keep health in props for later, avoid lint unused
  void health;

  const confPct = Math.round(clamp01(confidence) * 100);

  const slides = useMemo(() => {
    return (items ?? [])
      .filter((x) => (x.title || "").trim().length > 0)
      .filter((x) => (x.url || "").startsWith("http"))
      .slice(0, 8);
  }, [items]);

  const total = slides.length;
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    setIdx(0);
  }, [total]);

  useEffect(() => {
    if (total <= 1) return;
    if (hovered) return;

    const id = window.setInterval(() => {
      setIdx((prev) => (prev + 1) % total);
    }, 5000);

    return () => window.clearInterval(id);
  }, [total, hovered]);

  const current = total > 0 ? slides[idx] : null;
  const chip = chipForScore(current?.score);

  return (
    <>
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>Market Sentiment</span>
            <InfoButton onClick={() => setInfoOpen(true)} />
          </div>
        }
      >
        <div
          className="rowWrap"
          style={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <div style={{ fontWeight: 800 }}>
            Overall: {label}{" "}
            <span className="badge">Score {score.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ marginTop: 8, color: "var(--muted)" }}>
          Confidence: {confPct}%
        </div>

        <div
          style={{
            marginTop: 12,
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
            overflow: "hidden",
            position: "relative",
            height: 310,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {current ? (
            <a
              href={current.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                height: "100%",
                textDecoration: "none",
              }}
              title="Open article"
            >
              <div
                style={{
                  height: 160,
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                {current.imageUrl ? (
                  <img
                    src={current.imageUrl}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      transform: hovered ? "scale(1.01)" : "scale(1)",
                      transition: "transform 240ms ease",
                    }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%" }} />
                )}
              </div>

              <div style={{ padding: 14 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: "rgba(203,213,225,0.70)",
                    }}
                  >
                    {(current.publisher || "Source").trim()}
                    {current.publishedAt
                      ? ` • ${fmtTime(current.publishedAt)}`
                      : ""}
                  </div>

                  <span
                    style={{
                      fontSize: 12,
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: chip.bg,
                      border: `1px solid ${chip.bd}`,
                      color: chip.fg,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {chip.text}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontWeight: 800,
                    fontSize: 18,
                    lineHeight: 1.2,
                    color: "rgba(255,255,255,0.92)",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {current.title}
                </div>
              </div>
            </a>
          ) : (
            <div style={{ padding: 14, color: "var(--muted)" }}>
              No recent sentiment data available.
            </div>
          )}

          {total > 1 && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 10,
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                  pointerEvents: "none",
                }}
              >
                {Array.from({ length: total }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === idx ? 22 : 10,
                      height: 8,
                      borderRadius: 999,
                      background:
                        i === idx
                          ? "rgba(255,255,255,0.55)"
                          : "rgba(255,255,255,0.18)",
                      transition: "all 220ms ease",
                    }}
                  />
                ))}
              </div>

              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 6,
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {Array.from({ length: total }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIdx(i);
                    }}
                    aria-label={`Go to news ${i + 1}`}
                    style={{
                      width: i === idx ? 22 : 10,
                      height: 18,
                      borderRadius: 999,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>

              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 12,
                  backdropFilter: "blur(6px)",
                }}
              >
                News {idx + 1}/{total}
              </div>
            </>
          )}
        </div>
      </Card>

      <InfoDialog
        open={infoOpen}
        title='What does "Market Sentiment" mean?'
        onClose={() => setInfoOpen(false)}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div>
            We estimate sentiment by scoring recent news headlines about this
            stock. Scores range from <b>-1</b> (very negative) to <b>+1</b>{" "}
            (very positive).
          </div>

          <div>
            <b>Overall</b> is the average headline score: Positive ≥ <b>0.15</b>,
            Negative ≤ <b>-0.15</b>, otherwise Neutral.
          </div>

          <div>
            <b>Confidence</b> increases when we have more valid articles and when
            the average score is farther from 0. Mixed or few headlines lowers
            confidence.
          </div>

          <div>
            Tip: Sentiment is news-based and can change quickly. Use it as
            context, not as a buy/sell signal.
          </div>
        </div>
      </InfoDialog>
    </>
  );
}