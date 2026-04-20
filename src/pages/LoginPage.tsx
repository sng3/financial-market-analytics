import { useState } from "react";
import Card from "../components/Card";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!email.trim() || !pw.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      const user = await loginUser({
        email: email.trim(),
        password: pw,
      });

      localStorage.setItem("user", JSON.stringify(user));
      nav("/dashboard");
      window.location.reload();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: "grid", placeItems: "center", paddingTop: 28 }}>
      <div style={{ width: "min(520px, 100%)" }}>
        <Card title="Login">
          <div style={{ display: "grid", gap: 10 }}>
            <input
              className="input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="input"
              placeholder="Password"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />

            {error && (
              <div
                style={{
                  color: "#ff9b9b",
                  background: "rgba(231,76,60,0.10)",
                  border: "1px solid rgba(231,76,60,0.35)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            <button className="btn btnPrimary" onClick={handleLogin} disabled={loading}>
              {loading ? "Logging In..." : "Login"}
            </button>

            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              No account? <Link to="/signup" style={{ color: "var(--blue)" }}>Sign up</Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

