import React, { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onExport: (type: "pdf" | "excel") => void;
};

export default function ExportModal({ open, onClose, onExport }: Props) {
  const [type, setType] = useState<"pdf" | "excel">("pdf");

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 100,
        padding: 18,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(520px, 100%)",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 14,
          boxShadow: "var(--shadow)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontWeight: 900, fontSize: 18 }}>Export Dashboard Report</div>

        <div style={{ marginTop: 12, display: "grid", gap: 10, color: "var(--muted)" }}>
          <label className="row">
            <input type="radio" checked={type === "pdf"} onChange={() => setType("pdf")} />
            PDF Summary
          </label>

          <label className="row">
            <input type="radio" checked={type === "excel"} onChange={() => setType("excel")} />
            Excel Data
          </label>
        </div>

        <div className="rowWrap" style={{ justifyContent: "flex-end", marginTop: 14 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btnPrimary" onClick={() => onExport(type)}>Export</button>
        </div>
      </div>
    </div>
  );
}