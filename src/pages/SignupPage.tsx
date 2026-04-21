import { useState } from "react";
import Card from "../components/Card";
import { Link, useNavigate } from "react-router-dom";
import { signupUser } from "../services/api";

export default function SignupPage() {
  const nav = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError("");

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !pw.trim() || !pw2.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (pw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (pw !== pw2) {
      setError("Passwords do not match.");
      return;
    }

    if (!agree) {
      setError("Please agree to the terms and privacy policy.");
      return;
    }

    try {
      setLoading(true);

      const user = await signupUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: pw,
      });

      localStorage.setItem("user", JSON.stringify(user));
      nav("/onboarding");
      window.location.reload();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Signup failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container"
      style={{
        display: "grid",
        placeItems: "center",
        paddingTop: 28,
        paddingBottom: 28,
      }}
    >
      <div style={{ width: "min(720px, 100%)" }}>
        <Card title="Create Your Account">
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>
              Join Learn-2-Invest to save watchlists, manage alerts, and personalize your dashboard.
            </div>

            <div className="grid2equal">
              <input
                className="input"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                className="input"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <input
              className="input"
              placeholder="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="input"
              placeholder="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <div className="grid2equal">
              <input
                className="input"
                placeholder="Password"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
              <input
                className="input"
                placeholder="Confirm Password"
                type="password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
              />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--muted)", fontSize: 14 }}>
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              I agree to the Terms of Service and Privacy Policy
            </label>

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

            <button
              className="btn btnPrimary"
              onClick={handleSignup}
              style={{ width: "100%" }}
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Continue"}
            </button>

            <div style={{ color: "var(--muted)", fontSize: 14 }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: "var(--blue)", fontWeight: 600 }}>
                Login
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

