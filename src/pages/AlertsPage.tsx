// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import AlertsTable from "../components/AlertsTable";

// type Alert = {
//   id: string;
//   ticker: string;
//   condition: "Above" | "Below";
//   price: number;
//   status: "Active" | "Triggered";
//   createdAt: string;
// };

// export default function AlertsPage() {
//   const nav = useNavigate();

//   const [alerts, setAlerts] = useState<Alert[]>([
//     { id: "1", ticker: "AAPL", condition: "Above", price: 190, status: "Active", createdAt: "2026-02-08" },
//     { id: "2", ticker: "TSLA", condition: "Below", price: 230, status: "Triggered", createdAt: "2026-02-06" },
//   ]);

//   useEffect(() => {
//     const user = localStorage.getItem("user");
//     if (!user) {
//       nav("/login");
//     }
//   }, [nav]);

//   return (
//     <div className="container">
//       <div className="pageTitle">Alerts</div>
//       <AlertsTable
//         alerts={alerts}
//         onCreate={(a: { ticker: string; condition: "Above" | "Below"; price: number }) => {
//           const id = String(Date.now());

//           const newAlert: Alert = {
//             id,
//             ticker: a.ticker,
//             condition: a.condition,
//             price: a.price,
//             status: "Active",
//             createdAt: new Date().toISOString().slice(0, 10),
//           };

//           setAlerts((prev: Alert[]) => [...prev, newAlert]);
//         }}
//       />
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertsTable from "../components/AlertsTable";
import {
  fetchUserAlerts,
  createAlert,
  deleteAlert,
  type AlertItem,
} from "../services/api";

export default function AlertsPage() {
  const nav = useNavigate();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const userRaw = localStorage.getItem("user");

        if (!userRaw) {
          nav("/login");
          return;
        }

        const user = JSON.parse(userRaw);
        const userId = user.id;

        if (!userId) {
          nav("/login");
          return;
        }

        const userAlerts = await fetchUserAlerts(userId);
        setAlerts(userAlerts);
      } catch (error) {
        console.error("Failed to load alerts:", error);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [nav]);

  const handleCreate = async (a: {
    ticker: string;
    condition: "Above" | "Below";
    price: number;
  }) => {
    try {
      const userRaw = localStorage.getItem("user");

      if (!userRaw) {
        nav("/login");
        return;
      }

      const user = JSON.parse(userRaw);
      const userId = user.id;

      if (!userId) {
        nav("/login");
        return;
      }

      const newAlert = await createAlert(userId, a);
      setAlerts((prev) => [newAlert, ...prev]);
    } catch (error) {
      console.error("Failed to create alert:", error);
      alert("Failed to create alert");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await deleteAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Failed to delete alert:", error);
      alert("Failed to delete alert");
    }
  };

  return (
    <div className="container">
      <div className="pageTitle">Alerts</div>

      {loading ? (
        <div style={{ color: "var(--muted)" }}>Loading alerts...</div>
      ) : (
        <AlertsTable
          alerts={alerts}
          onCreate={handleCreate}
          onRemove={handleRemove}
        />
      )}
    </div>
  );
}