import Panel from "../components/ui/Panel";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <div>
      <h1 className="pageTitle">Dashboard</h1>
      <p className="muted">Your watchlist summary, alerts, and recommendations.</p>

      <div className="dashGrid">
        <Panel title="Watchlist Summary">
          <p className="muted">Coming soon: list of saved stocks from SQLite.</p>
        </Panel>

        <Panel title="Market Overview">
          <p className="muted">Coming soon: top movers, indices summary.</p>
        </Panel>

        <Panel title="Alerts">
          <p className="muted">Coming soon: price and sentiment alerts.</p>
        </Panel>

        <Panel title="Recommendations">
          <p className="muted">Coming soon: recommendations based on risk profile.</p>
        </Panel>
      </div>
    </div>
  );
}
