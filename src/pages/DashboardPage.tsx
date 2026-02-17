import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { fetchStock, type StockResponse } from "../services/api";

import StockSearchBar from "../components/StockSearchBar";
import PriceOverviewCard from "../components/PriceOverviewCard";
import HistoricalChartCard from "../components/HistoricalChartCard";
import TechnicalIndicatorsCard from "../components/TechnicalIndicatorsCard";
import SentimentCard from "../components/SentimentCard";
import PredictionCard from "../components/PredictionCard";
import RiskRecommendationCard from "../components/RiskRecommendationCard";
import ExportModal from "../components/ExportModal";
import Card from "../components/Card";

function nowTimeString() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();

  const initial = params.get("t") ?? "AAPL";
  const [ticker, setTicker] = useState(initial.toUpperCase());
  const [exportOpen, setExportOpen] = useState(false);

  // ✅ New state for real-time data
  const [stock, setStock] = useState<StockResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  // ✅ Fetch real-time data whenever ticker changes
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await fetchStock(ticker);
        setStock(data);
      } catch (e: unknown) {
        const anyE = e as any;
        setStock(null);
        setErr(anyE?.response?.data?.error ?? "Failed to fetch stock data");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [ticker]);

  // ✅ Use real data if available; fallback to demo values if not
  const overview = {
    ticker: stock?.ticker ?? ticker,
    name: stock?.name ?? "Example Company",
    price: stock?.price ?? 182.45,
    change: stock?.change ?? 2.13,
    changePct: stock?.changePct ?? 1.18,
    updatedAt: stock?.updatedAt ?? nowTimeString(),
    marketStatus: "Open" as const,
  };

  // Placeholder series (you can replace later with real historical data)
  const series = useMemo(
    () =>
      Array.from({ length: 120 }, (_, i) => ({
        t: `T${i}`,
        v: 160 + i * 0.2 + Math.sin(i / 6) * 2,
      })),
    [ticker]
  );

  return (
    <div className="container">
      <div style={{ margin: "14px 0" }}>
        <StockSearchBar
          onSelectTicker={(t) => {
            const next = t.toUpperCase();
            setTicker(next);
            nav(`/dashboard?t=${encodeURIComponent(next)}`);
          }}
        />
      </div>

      {/* ✅ Loading + Error messages for real-time data */}
      {loading && (
        <div style={{ marginTop: 12, color: "var(--muted)" }}>Loading...</div>
      )}
      {err && (
        <div style={{ marginTop: 12, color: "var(--red)" }}>{err}</div>
      )}

      <PriceOverviewCard {...overview} />

      <div className="grid2" style={{ marginTop: 14 }}>
        <HistoricalChartCard series={series} />
        <TechnicalIndicatorsCard rsi={62} smaTrend="Up" />
      </div>

      <div className="grid2equal" style={{ marginTop: 14 }}>
        <SentimentCard
          label="Positive"
          score={0.67}
          headlines={[
            "Company reports stronger-than-expected earnings",
            "Analysts raise target price after guidance update",
            "Market sentiment improves after macro news",
          ]}
        />
        <PredictionCard horizon="7-day" trend="Up" confidence={78} />
      </div>

      <div style={{ marginTop: 14 }}>
        <RiskRecommendationCard />
      </div>

      <div style={{ marginTop: 14 }}>
        <Card title="Actions">
          <div className="rowWrap">
            <button className="btn">★ Add to Watchlist</button>
            <button className="btn">⏰ Set Alert</button>
            <button
              className="btn btnPrimary"
              onClick={() => setExportOpen(true)}
            >
              ⬇ Export
            </button>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 14, color: "var(--muted2)", fontSize: 13 }}>
        Educational use only. Not financial advice.
      </div>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={(type) => {
          setExportOpen(false);
          // Hook jsPDF / SheetJS here
          alert(`Export requested: ${type.toUpperCase()}`);
        }}
      />
    </div>
  );
}