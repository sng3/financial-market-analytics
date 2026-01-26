import { useState } from "react";
import Panel from "../components/ui/Panel";
import "./Profile.css";

type Risk = "Conservative" | "Moderate" | "Aggressive";

export default function Profile() {
  const [risk, setRisk] = useState<Risk>("Moderate");

  return (
    <div>
      <h1 className="pageTitle">Profile</h1>
      <p className="muted">Set your risk tolerance to personalize recommendations.</p>

      <div className="profileGrid">
        <Panel title="Risk Tolerance">
          <div className="radioGroup">
            {(["Conservative", "Moderate", "Aggressive"] as Risk[]).map((r) => (
              <label key={r} className="radioRow">
                <input
                  type="radio"
                  name="risk"
                  checked={risk === r}
                  onChange={() => setRisk(r)}
                />
                <span>{r}</span>
              </label>
            ))}
          </div>

          <p className="muted" style={{ marginTop: 10 }}>
            Current selection: <b>{risk}</b>
          </p>
        </Panel>

        <Panel title="Notification Settings">
          <p className="muted">Coming soon: alert preferences stored in SQLite.</p>
        </Panel>
      </div>
    </div>
  );
}
