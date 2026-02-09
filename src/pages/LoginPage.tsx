import React, { useState } from "react";
import Card from "../components/Card";
import { Link } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  return (
    <div className="container" style={{ display: "grid", placeItems: "center", paddingTop: 28 }}>
      <div style={{ width: "min(520px, 100%)" }}>
        <Card title="Login">
          <div style={{ display: "grid", gap: 10 }}>
            <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input" placeholder="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />

            <button className="btn btnPrimary">Login</button>

            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              No account? <Link to="/signup" style={{ color: "var(--blue)" }}>Sign up</Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}