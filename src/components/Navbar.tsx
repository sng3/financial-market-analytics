import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

export default function Navbar() {
  const nav = useNavigate();
  const location = useLocation();

  const storedUser = localStorage.getItem("user");
  const isLoggedIn = !!storedUser;

  const handleLogout = () => {
    localStorage.removeItem("user");
    nav("/login");
  };

  return (
    <div className="navbar">
      <div className="container navbarInner">
        <div className="brand" onClick={() => nav("/")}>
          <div className="brandLogo" aria-label="Logo">
            L2I
          </div>
          <div className="brandText">Learn-2-Invest</div>
        </div>

        <div className="navGroup">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `navLink ${isActive ? "active" : ""}`}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/watchlist"
            className={({ isActive }) => `navLink ${isActive ? "active" : ""}`}
          >
            Watchlist
          </NavLink>

          <NavLink
            to="/alerts"
            className={({ isActive }) => `navLink ${isActive ? "active" : ""}`}
          >
            Alerts
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `navLink ${isActive ? "active" : ""}`}
          >
            Profile
          </NavLink>
        </div>

        <div className="navGroup" key={location.pathname + String(isLoggedIn)}>
          {isLoggedIn ? (
            <button type="button" className="btn" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <>
              <NavLink to="/login" className="btn">
                Login
              </NavLink>
              <NavLink to="/signup" className="btn btnPrimary">
                Sign Up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </div>
  );
}