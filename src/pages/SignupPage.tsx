import React, { useState } from "react";
import Card from "../components/Card";
import { Link } from "react-router-dom";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  return (
    <div className="container" style={{ display: "grid", placeItems: "center", paddingTop: 28 }}>
      <div style={{ width: "min(520px, 100%)" }}>
        <Card title="Sign Up">
          <div style={{ display: "grid", gap: 10 }}>
            <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input" placeholder="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <input className="input" placeholder="Confirm Password" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />

            <button className="btn btnPrimary">Create Account</button>

            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              Already have an account? <Link to="/login" style={{ color: "var(--blue)" }}>Login</Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}