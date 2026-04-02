// import React, { useEffect, useState } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import AlertsTable from "../components/AlertsTable";
// import {
//   fetchUserAlerts,
//   createAlert,
//   deleteAlert,
//   type AlertItem,
// } from "../services/api";

// export default function AlertsPage() {
//   const nav = useNavigate();
//   const [params] = useSearchParams();

//   const [alerts, setAlerts] = useState<AlertItem[]>([]);
//   const [loading, setLoading] = useState(true);

//   const defaultTicker = params.get("t")?.toUpperCase() || "AAPL";

//   useEffect(() => {
//     const loadAlerts = async () => {
//       try {
//         const userRaw = localStorage.getItem("user");

//         if (!userRaw) {
//           nav("/login");
//           return;
//         }

//         const user = JSON.parse(userRaw);
//         const userId = user.id;

//         if (!userId) {
//           nav("/login");
//           return;
//         }

//         const userAlerts = await fetchUserAlerts(userId);
//         setAlerts(userAlerts);
//       } catch (error) {
//         console.error("Failed to load alerts:", error);
//         setAlerts([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadAlerts();
//   }, [nav]);

//   const handleCreate = async (a: {
//     ticker: string;
//     condition: "Above" | "Below";
//     price: number;
//   }) => {
//     try {
//       const userRaw = localStorage.getItem("user");

//       if (!userRaw) {
//         nav("/login");
//         return;
//       }

//       const user = JSON.parse(userRaw);
//       const userId = user.id;

//       if (!userId) {
//         nav("/login");
//         return;
//       }

//       const newAlert = await createAlert(userId, a);
//       setAlerts((prev) => [newAlert, ...prev]);
//     } catch (error) {
//       console.error("Failed to create alert:", error);
//       alert("Failed to create alert");
//     }
//   };

//   const handleRemove = async (id: string) => {
//     try {
//       await deleteAlert(id);
//       setAlerts((prev) => prev.filter((a) => a.id !== id));
//     } catch (error) {
//       console.error("Failed to delete alert:", error);
//       alert("Failed to delete alert");
//     }
//   };

//   return (
//     <div className="container">
//       <div className="pageTitle">Alerts</div>

//       {loading ? (
//         <div style={{ color: "var(--muted)" }}>Loading alerts...</div>
//       ) : (
//         <AlertsTable
//           alerts={alerts}
//           onCreate={handleCreate}
//           onRemove={handleRemove}
//           defaultTicker={defaultTicker}
//         />
//       )}
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AlertsTable from "../components/AlertsTable";
import {
  fetchUserAlerts,
  createAlert,
  deleteAlert,
  checkUserAlerts,
  type AlertItem,
} from "../services/api";

export default function AlertsPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultTicker = params.get("t")?.toUpperCase() || "AAPL";

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

  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    if (!userRaw) return;

    let userId: number | null = null;

    try {
      const user = JSON.parse(userRaw);
      userId = user?.id ?? null;
    } catch {
      userId = null;
    }

    if (!userId) return;

    let alive = true;

    const runCheck = async () => {
      try {
        await checkUserAlerts(userId as number);

        const refreshedAlerts = await fetchUserAlerts(userId as number);
        if (!alive) return;
        setAlerts(refreshedAlerts);
      } catch (error) {
        if (!alive) return;
        console.error("Failed to check alerts:", error);
      }
    };

    runCheck();
    const intervalId = window.setInterval(runCheck, 60000);

    return () => {
      alive = false;
      window.clearInterval(intervalId);
    };
  }, []);

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
    } catch (error: any) {
      console.error("Failed to create alert:", error);
      alert(error?.response?.data?.error ?? "Failed to create alert");
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
          defaultTicker={defaultTicker}
        />
      )}
    </div>
  );
}