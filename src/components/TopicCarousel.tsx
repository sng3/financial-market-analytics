import React, { useEffect, useState } from "react";

type Slide = {
  title: string;
  subtitle: string;
  imageUrl: string;
};

type Props = {
  slides: Slide[];
  intervalSeconds?: number;
};

export default function TopicCarousel({ slides, intervalSeconds = 6 }: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIdx((p) => (p + 1) % slides.length);
    }, intervalSeconds * 1000);
    return () => window.clearInterval(id);
  }, [slides.length, intervalSeconds]);

  const s = slides[idx];

  return (
    <div
      style={{
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr" }}>
        <div style={{ padding: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{s.title}</div>
          <div style={{ marginTop: 8, color: "var(--muted)" }}>{s.subtitle}</div>

          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="btn"
                style={{
                  padding: "6px 10px",
                  opacity: i === idx ? 1 : 0.45,
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div style={{ minHeight: 140 }}>
          <img
            src={s.imageUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>
    </div>
  );
}