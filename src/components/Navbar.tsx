import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  padding: "8px 10px",
  borderRadius: 12,
  border: `1px solid ${isActive ? "rgba(74,144,226,0.6)" : "transparent"}`,
  background: isActive ? "rgba(74,144,226,0.12)" : "transparent",
  color: isActive ? "var(--text)" : "var(--muted)",
});

export default function Navbar() {
  const nav = useNavigate();

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(10px)",
        background: "rgba(15,17,21,0.72)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div
          onClick={() => nav("/")}
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: "rgba(74,144,226,0.18)",
              border: "1px solid rgba(74,144,226,0.35)",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
            }}
            aria-label="Logo"
          >
            L2I
          </div>
          <div style={{ fontWeight: 800 }}>Learn-2-Invest</div>
        </div>

        <div className="rowWrap">
          <NavLink to="/dashboard" style={linkStyle}>Dashboard</NavLink>
          <NavLink to="/watchlist" style={linkStyle}>Watchlist</NavLink>
          <NavLink to="/alerts" style={linkStyle}>Alerts</NavLink>
          <NavLink to="/profile" style={linkStyle}>Profile</NavLink>
        </div>

        <div className="rowWrap">
          <NavLink to="/login" className="btn">Login</NavLink>
          <NavLink to="/signup" className="btn btnPrimary">Sign Up</NavLink>
        </div>
      </div>
    </div>
  );
}