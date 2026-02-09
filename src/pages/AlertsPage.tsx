import React, { useState } from "react";
import AlertsTable from "../components/AlertsTable";

type Alert = {
  id: string;
  ticker: string;
  condition: "Above" | "Below";
  price: number;
  status: "Active" | "Triggered";
  createdAt: string;
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: "1", ticker: "AAPL", condition: "Above", price: 190, status: "Active", createdAt: "2026-02-08" },
    { id: "2", ticker: "TSLA", condition: "Below", price: 230, status: "Triggered", createdAt: "2026-02-06" },
  ]);

  return (
    <div className="container">
      <div className="pageTitle">Alerts</div>
      <AlertsTable
        alerts={alerts}
        onCreate={(a: { ticker: string; condition: "Above" | "Below"; price: number }) => {
          const id = String(Date.now());
          const newAlert: Alert = {
            id,
            ticker: a.ticker,
            condition: a.condition,
            price: a.price,
            status: "Active",
            createdAt: new Date().toISOString().slice(0, 10),
          };

          setAlerts((prev: Alert[]) => [...prev, newAlert]);
        }}
      />
    </div>
  );
}