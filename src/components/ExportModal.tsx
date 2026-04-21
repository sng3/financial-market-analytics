import { useEffect, useState } from "react";

type ExportType = "pdf" | "excel";

type Props = {
  open: boolean;
  onClose: () => void;
  onExport: (type: ExportType) => void | Promise<void>;
};

export default function ExportModal({ open, onClose, onExport }: Props) {
  const [type, setType] = useState<ExportType>("pdf");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (open) {
      setType("pdf");
      setExporting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleExport = async () => {
    try {
      setExporting(true);
      await onExport(type);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "grid",
        placeItems: "center",
        zIndex: 100,
        padding: 18,
      }}
      onClick={() => {
        if (!exporting) onClose();
      }}
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
        <div id="export-modal-title" style={{ fontWeight: 900, fontSize: 18 }}>
          Export Dashboard Report
        </div>

        <div
          style={{
            marginTop: 12,
            display: "grid",
            gap: 10,
            color: "var(--muted)",
          }}
        >
          <label className="row">
            <input
              type="radio"
              name="exportType"
              checked={type === "pdf"}
              onChange={() => setType("pdf")}
              disabled={exporting}
            />
            PDF Summary
          </label>

          <label className="row">
            <input
              type="radio"
              name="exportType"
              checked={type === "excel"}
              onChange={() => setType("excel")}
              disabled={exporting}
            />
            Excel Data
          </label>
        </div>

        <div
          className="rowWrap"
          style={{ justifyContent: "flex-end", marginTop: 14 }}
        >
          <button className="btn" onClick={onClose} disabled={exporting}>
            Cancel
          </button>
          <button
            className="btn btnPrimary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}