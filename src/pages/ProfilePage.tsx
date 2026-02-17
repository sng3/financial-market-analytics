import React, { useState } from "react";
import Card from "../components/Card";

export default function ProfilePage() {
  const [risk, setRisk] = useState<"Conservative" | "Moderate" | "Aggressive">("Moderate");

  return (
    <div className="container">
      <div className="pageTitle">Profile</div>

      <div className="grid2equal">
        <Card title="Account">
          <div style={{ color: "var(--muted)" }}>Email: user@example.com</div>
          <div style={{ marginTop: 10 }}>
            <button className="btn">Logout</button>
          </div>
        </Card>

        <Card title="Preferences">
          <div style={{ color: "var(--muted2)", fontSize: 12, marginBottom: 6 }}>Risk Tolerance</div>
          <select className="input" value={risk} onChange={(e) => setRisk(e.target.value as any)}>
            <option value="Conservative">Conservative</option>
            <option value="Moderate">Moderate</option>
            <option value="Aggressive">Aggressive</option>
          </select>

          <div style={{ marginTop: 10, color: "var(--muted)" }}>
            This setting affects recommendations and educational tips across the dashboard.
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 14 }}>
        <Card title="Data">
          <div className="rowWrap">
            <button className="btn">Clear Watchlist</button>
            <button className="btn">Clear Alerts</button>
          </div>
        </Card>
      </div>
    </div>
  );
}