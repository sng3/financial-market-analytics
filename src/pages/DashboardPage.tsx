import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { fetchStock, fetchSentiment, fetchIndicators } from "../services/api";
import type {
  StockResponse,
  SentimentResponse,
  IndicatorsResponse,
} from "../services/api";

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

// Coerce backend values into the exact union type the card expects
function coerceSmaTrend(v: unknown): "Up" | "Down" | "Flat" {
  if (v === "Up" || v === "Down" || v === "Flat") return v;
  if (typeof v === "string") {
    const s = v.toLowerCase();
    if (s.includes("up")) return "Up";
    if (s.includes("down")) return "Down";
  }
  return "Flat";
}

export default function DashboardPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();

  const initial = params.get("t") ?? "AAPL";
  const [ticker, setTicker] = useState(initial.toUpperCase());
  const [exportOpen, setExportOpen] = useState(false);

  // Stock (real-time)
  const [stock, setStock] = useState<StockResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  // Sentiment
  const [sentiment, setSentiment] = useState<SentimentResponse | null>(null);
  const [sentLoading, setSentLoading] = useState(false); // keep state, but do not render a loading message
  const [sentErr, setSentErr] = useState<string>("");

  // Technical Indicators
  const [indicators, setIndicators] = useState<IndicatorsResponse | null>(null);
  const [indLoading, setIndLoading] = useState(false); // keep state, but do not render a loading message
  const [indErr, setIndErr] = useState<string>("");

  // ----------------------------
  // Fetch stock whenever ticker changes
  // ----------------------------
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

  // ----------------------------
  // Poll sentiment every X seconds (and immediately once)
  // ----------------------------
  useEffect(() => {
    let alive = true;

    const load = async () => {
      setSentLoading(true);
      setSentErr("");
      try {
        const data = await fetchSentiment(ticker);
        if (alive) setSentiment(data);
      } catch (e: unknown) {
        const anyE = e as any;
        if (alive) {
          setSentiment(null);
          setSentErr(anyE?.response?.data?.error ?? "Failed to fetch sentiment");
        }
      } finally {
        if (alive) setSentLoading(false);
      }
    };

    load();

    const intervalSeconds = 30;
    const id = window.setInterval(load, intervalSeconds * 1000);

    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [ticker]);

  // ----------------------------
  // Poll indicators every X seconds (and immediately once)
  // ----------------------------
  useEffect(() => {
    let alive = true;

    const load = async () => {
      setIndLoading(true);
      setIndErr("");
      try {
        const data = await fetchIndicators(ticker);
        if (alive) setIndicators(data);
      } catch (e: unknown) {
        const anyE = e as any;
        if (alive) {
          setIndicators(null);
          setIndErr(anyE?.response?.data?.error ?? "Failed to fetch indicators");
        }
      } finally {
        if (alive) setIndLoading(false);
      }
    };

    load();

    const intervalSeconds = 30;
    const id = window.setInterval(load, intervalSeconds * 1000);

    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [ticker]);

  // Use real data if available; fallback if not
  const overview = {
    ticker: stock?.ticker ?? ticker,
    name: stock?.name ?? "Example Company",
    price: stock?.price ?? 182.45,
    change: stock?.change ?? 2.13,
    changePct: stock?.changePct ?? 1.18,
    updatedAt: stock?.updatedAt ?? nowTimeString(),
    marketStatus: "Open" as const,
  };

  // Placeholder series (replace later with real historical data)
  const series = useMemo(
    () =>
      Array.from({ length: 120 }, (_, i) => ({
        t: `T${i}`,
        v: 160 + i * 0.2 + Math.sin(i / 6) * 2,
      })),
    [ticker]
  );

  // Defaults for indicators card
  const rsiValue = indicators?.rsi ?? 50;
  const smaTrendValue = coerceSmaTrend((indicators as any)?.smaTrend);

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

      {/* Stock loading / error (optional: keep loading, usually not annoying) */}
      {loading && (
        <div style={{ marginTop: 12, color: "var(--muted)" }}>Loading...</div>
      )}
      {err && <div style={{ marginTop: 12, color: "var(--red)" }}>{err}</div>}

      <PriceOverviewCard {...overview} />

      <div className="grid2" style={{ marginTop: 14 }}>
        <HistoricalChartCard series={series} />

        <div>
          {/* Indicators error only (no loading flicker) */}
          {indErr && (
            <div style={{ marginBottom: 10, color: "var(--red)" }}>{indErr}</div>
          )}

          <TechnicalIndicatorsCard rsi={rsiValue} smaTrend={smaTrendValue} />
        </div>
      </div>

      <div className="grid2equal" style={{ marginTop: 14 }}>
        <div>
          {/* Sentiment error only (no loading flicker) */}
          {sentErr && (
            <div style={{ marginBottom: 10, color: "var(--red)" }}>{sentErr}</div>
          )}

          <SentimentCard
            label={sentiment?.label ?? "Neutral"}
            score={sentiment?.score ?? 0}
            confidence={sentiment?.confidence ?? 0}
            items={(sentiment?.items ?? []).map((x) => {
              const publishedAt =
                typeof x.publishedAt === "number"
                  ? new Date(x.publishedAt * 1000).toISOString()
                  : x.publishedAt ?? null;

              return {
                title: x.title,
                url: x.url,
                imageUrl: x.imageUrl,
                score: x.score,
                publisher: x.publisher,
                publishedAt,
              };
            })}
            health={
              sentiment?.health ?? {
                provider: "none",
                status: "error",
                warning: "No data",
              }
            }
          />
        </div>

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
        Educational use only. Not financial advice. All investment decisions are
        made at your own risk.
      </div>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={(type) => {
          setExportOpen(false);
          alert(`Export requested: ${type.toUpperCase()}`);
        }}
      />
    </div>
  );
}