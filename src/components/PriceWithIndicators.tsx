// ============================
// FRONTEND (React + TypeScript) FINAL "INTERACTIVE OVERLAY" COMPONENT
// Uses Recharts. This is what makes your weekly report bullet true.
// Drop this into something like: src/components/Analytics/PriceWithIndicators.tsx
// ============================

import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

type IndicatorSeriesResponse = {
  ticker: string;
  period: string;
  interval: string;
  timestamps: string[];
  close: number[];
  sma20: (number | null)[];
  sma50: (number | null)[];
  rsi14: (number | null)[];
  updatedAt: number;
};

type ChartRow = {
  date: string;
  close: number;
  sma20?: number | null;
  sma50?: number | null;
  rsi14?: number | null;
};

function rsiLabel(rsi: number | null | undefined): string {
  if (rsi === null || rsi === undefined) return "N/A";
  if (rsi >= 70) return "Overbought";
  if (rsi <= 30) return "Oversold";
  return "Neutral";
}

function trendLabel(sma20: number | null | undefined, sma50: number | null | undefined): string {
  if (sma20 === null || sma20 === undefined || sma50 === null || sma50 === undefined) return "N/A";
  if (sma20 > sma50) return "Uptrend";
  if (sma20 < sma50) return "Downtrend";
  return "Sideways";
}

export default function PriceWithIndicators({ ticker }: { ticker: string }) {
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string>("");
  const [data, setData] = useState<IndicatorSeriesResponse | null>(null);

  const [showSMA20, setShowSMA20] = useState<boolean>(true);
  const [showSMA50, setShowSMA50] = useState<boolean>(false);
  const [showRSI, setShowRSI] = useState<boolean>(false);

  useEffect(() => {
    if (!ticker) return;

    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(
          `http://127.0.0.1:5000/api/indicator_series?ticker=${encodeURIComponent(ticker)}&period=6mo&interval=1d`,
          { signal: controller.signal }
        );
        const json = (await res.json()) as IndicatorSeriesResponse | { error: string };
        if (!res.ok || "error" in json) {
          setErr("error" in json ? json.error : "Failed to load series");
          setData(null);
          return;
        }
        setData(json as IndicatorSeriesResponse);
      } catch (e: unknown) {
        if ((e as { name?: string }).name !== "AbortError") setErr("Failed to fetch indicator series");
      } finally {
        setLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [ticker]);

  const rows: ChartRow[] = useMemo(() => {
    if (!data) return [];
    const out: ChartRow[] = [];
    for (let i = 0; i < data.timestamps.length; i++) {
      out.push({
        date: data.timestamps[i],
        close: data.close[i],
        sma20: data.sma20[i],
        sma50: data.sma50[i],
        rsi14: data.rsi14[i],
      });
    }
    return out;
  }, [data]);

  const latest = useMemo(() => {
    if (!rows.length) return null;

    // Find latest index that has close
    const i = rows.length - 1;
    return {
      close: rows[i].close,
      sma20: rows[i].sma20 ?? null,
      sma50: rows[i].sma50 ?? null,
      rsi14: rows[i].rsi14 ?? null,
      date: rows[i].date,
    };
  }, [rows]);

  return (
    <div style={{ background: "#111318", borderRadius: 16, padding: 18, border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Price + Indicators</div>
          <div style={{ opacity: 0.75, marginTop: 4 }}>
            Ticker: <b>{ticker}</b>
            {latest ? <> · Last: <b>{latest.date}</b></> : null}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={showSMA20} onChange={(e) => setShowSMA20(e.target.checked)} />
            SMA20
          </label>

          <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={showSMA50} onChange={(e) => setShowSMA50(e.target.checked)} />
            SMA50
          </label>

          <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={showRSI} onChange={(e) => setShowRSI(e.target.checked)} />
            RSI panel
          </label>
        </div>
      </div>

      {/* Summary (matches your card but now backed by real series overlays) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10, marginBottom: 14 }}>
        <div style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.03)" }}>
          <div style={{ opacity: 0.75, fontSize: 12 }}>RSI(14)</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {latest?.rsi14 == null ? "N/A" : Math.round(latest.rsi14)}
          </div>
          <div style={{ opacity: 0.75, fontSize: 12 }}>{rsiLabel(latest?.rsi14 ?? null)}</div>
        </div>

        <div style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.03)" }}>
          <div style={{ opacity: 0.75, fontSize: 12 }}>SMA20</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {latest?.sma20 == null ? "N/A" : latest.sma20.toFixed(2)}
          </div>
        </div>

        <div style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.03)" }}>
          <div style={{ opacity: 0.75, fontSize: 12 }}>SMA50</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {latest?.sma50 == null ? "N/A" : latest.sma50.toFixed(2)}
          </div>
        </div>

        <div style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.03)" }}>
          <div style={{ opacity: 0.75, fontSize: 12 }}>Trend (SMA20 vs SMA50)</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {trendLabel(latest?.sma20 ?? null, latest?.sma50 ?? null)}
          </div>
        </div>
      </div>

      {loading ? <div style={{ opacity: 0.8 }}>Loading series…</div> : null}
      {err ? <div style={{ color: "#ff6b6b" }}>{err}</div> : null}

      {!loading && !err && rows.length > 0 ? (
        <>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={rows} margin={{ top: 8, right: 20, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={30} />
                <YAxis tick={{ fontSize: 12 }} domain={["auto", "auto"]} />
                <Tooltip />
                <Legend />

                <Line type="monotone" dataKey="close" dot={false} strokeWidth={2} name="Close" />
                {showSMA20 ? <Line type="monotone" dataKey="sma20" dot={false} strokeWidth={2} name="SMA20" connectNulls /> : null}
                {showSMA50 ? <Line type="monotone" dataKey="sma50" dot={false} strokeWidth={2} name="SMA50" connectNulls /> : null}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {showRSI ? (
            <div style={{ width: "100%", height: 220, marginTop: 16 }}>
              <ResponsiveContainer>
                <LineChart data={rows} margin={{ top: 8, right: 20, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={30} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rsi14" dot={false} strokeWidth={2} name="RSI(14)" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}