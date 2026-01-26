import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <div
      style={{
        padding: "12px 20px",
        display: "flex",
        gap: "16px",
        alignItems: "center",
        borderBottom: "1px solid #ddd",
      }}
    >
      <b>Financial Market Analytics</b>
      <Link to="/">Home</Link>
      <Link to="/dashboard">Dashboard</Link>
    </div>
  );
}
