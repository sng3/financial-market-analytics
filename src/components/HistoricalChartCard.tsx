import React, { useMemo, useState } from "react";
import Card from "./Card";

type Props = {
  // For now, just placeholder data
  series: { t: string; v: number }[];
};

const ranges = ["1D", "5D", "1M", "6M", "1Y", "Max"] as const;

export default function HistoricalChartCard({ series }: Props) {
  const [range, setRange] = useState<(typeof ranges)[number]>("1Y");
  const [showSMA, setShowSMA] = useState(true);
  const [showRSI, setShowRSI] = useState(false);

  // Placeholder: you will later slice series based on range
  const view = useMemo(() => series.slice(-40), [series]);

  return (
    <Card
      title="Historical Price Chart"
      right={
        <div className="rowWrap">
          {ranges.map((r) => (
            <button
              key={r}
              className="btn"
              style={{
                padding: "6px 10px",
                borderColor: r === range ? "rgba(74,144,226,0.6)" : "var(--border)",
                background: r === range ? "rgba(74,144,226,0.12)" : "rgba(255,255,255,0.02)",
              }}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      }
    >
      <div style={{ height: 260, border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 14, display: "grid", placeItems: "center", color: "var(--muted)" }}>
        Chart placeholder (connect Chart.js here)
        <div style={{ fontSize: 12, marginTop: 6 }}>
          Points: {view.length} | Range: {range}
        </div>
      </div>

      <div className="rowWrap" style={{ marginTop: 12 }}>
        <label className="row" style={{ color: "var(--muted)" }}>
          <input type="checkbox" checked={showSMA} onChange={(e) => setShowSMA(e.target.checked)} />
          SMA
        </label>
        <label className="row" style={{ color: "var(--muted)" }}>
          <input type="checkbox" checked={showRSI} onChange={(e) => setShowRSI(e.target.checked)} />
          RSI
        </label>
      </div>
    </Card>
  );
}

// import React, { useEffect, useMemo, useState } from "react";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Tooltip,
//   Legend,
//   TimeScale,
//   Filler,
// } from "chart.js";
// import { Line } from "react-chartjs-2";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   TimeScale,
//   Tooltip,
//   Legend,
//   Filler
// );

// type RangeKey = "1D" | "5D" | "1M" | "6M" | "1Y" | "Max";

// type HistoryResponse = {
//   ticker: string;
//   days: number;
//   series: { date: string; close: number }[];
// };

// type IndicatorSeriesResponse = {
//   ticker: string;
//   period: string;
//   interval: string;
//   timestamps: string[];
//   close: number[];
//   sma20: Array<number | null>;
//   sma50: Array<number | null>;
//   rsi14: Array<number | null>;
//   updatedAt: number;
// };

// const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

// function rangeToHistoryQuery(range: RangeKey) {
//   // This assumes your backend /api/history uses ?range=...
//   // If your backend uses days instead, we can change it easily.
//   // Keep it consistent with your existing backend mapping.
//   return range.toLowerCase(); // "1d", "5d", "1m", "6m", "1y", "max"
// }

// function rangeToIndicatorPeriod(range: RangeKey) {
//   // yfinance periods that work well for indicator series
//   if (range === "1D") return "5d";
//   if (range === "5D") return "5d";
//   if (range === "1M") return "1mo";
//   if (range === "6M") return "6mo";
//   if (range === "1Y") return "1y";
//   return "max";
// }

// export default function HistoricalChartCard(props: { ticker: string }) {
//   const ticker = (props.ticker || "").toUpperCase();

//   const [range, setRange] = useState<RangeKey>("1Y");
//   const [showSMA, setShowSMA] = useState<boolean>(true);
//   const [showRSI, setShowRSI] = useState<boolean>(false);

//   const [history, setHistory] = useState<HistoryResponse | null>(null);
//   const [indSeries, setIndSeries] = useState<IndicatorSeriesResponse | null>(null);

//   const [loading, setLoading] = useState<boolean>(false);
//   const [err, setErr] = useState<string>("");

//   useEffect(() => {
//     if (!ticker) return;

//     const controller = new AbortController();

//     async function load() {
//       try {
//         setLoading(true);
//         setErr("");

//         // Price history for main chart
//         const r = rangeToHistoryQuery(range);
//         const historyUrl = `${API_BASE}/api/history?ticker=${encodeURIComponent(
//           ticker
//         )}&range=${encodeURIComponent(r)}`;

//         const histRes = await fetch(historyUrl, { signal: controller.signal });
//         if (!histRes.ok) {
//           const text = await histRes.text();
//           throw new Error(`History failed (${histRes.status}): ${text}`);
//         }
//         const histJson = (await histRes.json()) as HistoryResponse;
//         setHistory(histJson);

//         // Indicator series for SMA/RSI overlays
//         const period = rangeToIndicatorPeriod(range);
//         const indUrl = `${API_BASE}/api/indicator_series?ticker=${encodeURIComponent(
//           ticker
//         )}&period=${encodeURIComponent(period)}&interval=1d`;

//         const indRes = await fetch(indUrl, { signal: controller.signal });
//         if (!indRes.ok) {
//           const text = await indRes.text();
//           throw new Error(`Indicators failed (${indRes.status}): ${text}`);
//         }
//         const indJson = (await indRes.json()) as IndicatorSeriesResponse;
//         setIndSeries(indJson);
//       } catch (e: unknown) {
//         if (e instanceof Error && e.name === "AbortError") return;
//         setErr(e instanceof Error ? e.message : "Failed to load chart data");
//       } finally {
//         setLoading(false);
//       }
//     }

//     load();
//     return () => controller.abort();
//   }, [ticker, range]);

//   const priceLabels = useMemo(() => {
//     // Prefer indicator timestamps if they exist (aligned arrays)
//     if (indSeries?.timestamps?.length) return indSeries.timestamps;
//     if (history?.series?.length) return history.series.map((p) => p.date);
//     return [];
//   }, [history, indSeries]);

//   const closeSeries = useMemo(() => {
//     if (indSeries?.close?.length) return indSeries.close;
//     if (history?.series?.length) return history.series.map((p) => p.close);
//     return [];
//   }, [history, indSeries]);

//   const priceChartData = useMemo(() => {
//     const datasets: any[] = [
//       {
//         label: "Close",
//         data: closeSeries,
//         tension: 0.25,
//         pointRadius: 0,
//       },
//     ];

//     if (showSMA && indSeries) {
//       datasets.push(
//         {
//           label: "SMA 20",
//           data: indSeries.sma20,
//           tension: 0.25,
//           pointRadius: 0,
//         },
//         {
//           label: "SMA 50",
//           data: indSeries.sma50,
//           tension: 0.25,
//           pointRadius: 0,
//         }
//       );
//     }

//     return { labels: priceLabels, datasets };
//   }, [priceLabels, closeSeries, indSeries, showSMA]);

//   const rsiChartData = useMemo(() => {
//     if (!indSeries) return { labels: [], datasets: [] };
//     return {
//       labels: indSeries.timestamps,
//       datasets: [
//         {
//           label: "RSI (14)",
//           data: indSeries.rsi14,
//           tension: 0.25,
//           pointRadius: 0,
//         },
//       ],
//     };
//   }, [indSeries]);

//   const baseOptions = useMemo(() => {
//     return {
//       responsive: true,
//       maintainAspectRatio: false,
//       plugins: {
//         legend: { display: true },
//         tooltip: { enabled: true },
//       },
//       scales: {
//         x: {
//           ticks: { maxTicksLimit: 8 },
//           grid: { display: false },
//         },
//         y: {
//           grid: { display: true },
//         },
//       },
//     } as const;
//   }, []);

//   const rsiOptions = useMemo(() => {
//     return {
//       ...baseOptions,
//       plugins: {
//         ...baseOptions.plugins,
//         legend: { display: true },
//       },
//       scales: {
//         ...baseOptions.scales,
//         y: {
//           min: 0,
//           max: 100,
//         },
//       },
//     } as const;
//   }, [baseOptions]);

//   const pointsText = useMemo(() => {
//     const pts = priceLabels.length;
//     return `Points: ${pts} | Range: ${range}`;
//   }, [priceLabels, range]);

//   if (!ticker) {
//     return <div className="card">Select a ticker</div>;
//   }

//   return (
//     <div className="card">
//       <div className="cardHeader">
//         <div className="cardTitle">Historical Price Chart</div>

//         <div className="rangeBtns">
//           {(["1D", "5D", "1M", "6M", "1Y", "Max"] as RangeKey[]).map((k) => (
//             <button
//               key={k}
//               className={`rangeBtn ${range === k ? "active" : ""}`}
//               onClick={() => setRange(k)}
//               type="button"
//             >
//               {k}
//             </button>
//           ))}
//         </div>
//       </div>

//       {err ? <div className="errorText">{err}</div> : null}
//       {loading ? <div className="mutedText">Loading chart...</div> : null}

//       <div className="chartWrap">
//         {priceLabels.length > 0 ? (
//           <Line data={priceChartData} options={baseOptions} />
//         ) : (
//           <div className="chartPlaceholder">No data</div>
//         )}
//       </div>

//       <div className="chartFooter">
//         <div className="mutedText">{pointsText}</div>

//         <div className="toggleRow">
//           <label className="toggle">
//             <input
//               type="checkbox"
//               checked={showSMA}
//               onChange={(e) => setShowSMA(e.target.checked)}
//             />
//             <span>SMA</span>
//           </label>

//           <label className="toggle">
//             <input
//               type="checkbox"
//               checked={showRSI}
//               onChange={(e) => setShowRSI(e.target.checked)}
//             />
//             <span>RSI</span>
//           </label>
//         </div>
//       </div>

//       {showRSI ? (
//         <div className="rsiWrap">
//           {indSeries?.timestamps?.length ? (
//             <Line data={rsiChartData} options={rsiOptions} />
//           ) : (
//             <div className="chartPlaceholder">RSI unavailable</div>
//           )}
//         </div>
//       ) : null}
//     </div>
//   );
// }