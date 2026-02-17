import React, { useEffect } from "react";

type Props = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

export default function InfoDialog({ open, title, children, onClose }: Props) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 18,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 100%)",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(17,20,26,0.96)",
          boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <div style={{ fontWeight: 900, color: "rgba(255,255,255,0.92)" }}>
            {title}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.85)",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ color: "var(--muted2)", fontSize: 13, lineHeight: 1.5 }}>
          {children}
        </div>
      </div>
    </div>
  );
}