import React from "react";

type CardProps = {
  title?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
};

export default function Card({ title, right, children }: CardProps) {
  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 14,
        boxShadow: "var(--shadow)",
      }}
    >
      {(title || right) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 700 }}>{title}</div>
          <div>{right}</div>
        </div>
      )}
      {children}
    </div>
  );
}