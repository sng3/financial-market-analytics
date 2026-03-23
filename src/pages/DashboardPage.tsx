import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import {
  fetchStock,
  fetchSentiment,
  fetchIndicators,
  fetchHistory,
  fetchPrediction,
  addToWatchlist,
  fetchUserWatchlists
} from "../services/api";

import type {
  StockResponse,
  SentimentResponse,
  IndicatorsResponse,
  HistoryPoint,
  PredictionResponse,
} from "../services/api";

import StockSearchBar from "../components/StockSearchBar";
import PriceOverviewCard from "../components/PriceOverviewCard";
import HistoricalChartCard, {
  type HistoryRange,
} from "../components/HistoricalChartCard";
import TechnicalIndicatorsCard from "../components/TechnicalIndicatorsCard";
import SentimentCard from "../components/SentimentCard";
import PredictionCard from "../components/PredictionCard";
import ExportModal from "../components/ExportModal";
import Card from "../components/Card";

type RiskProfile = "Conservative" | "Moderate" | "Aggressive";

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

  const [stock, setStock] = useState<StockResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [sentiment, setSentiment] = useState<SentimentResponse | null>(null);
  const [sentErr, setSentErr] = useState("");

  const [indicators, setIndicators] = useState<IndicatorsResponse | null>(null);
  const [indErr, setIndErr] = useState("");

  const [historySeries, setHistorySeries] = useState<HistoryPoint[]>([]);
  const [historyErr, setHistoryErr] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState<HistoryRange>("1Y");

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [predictionErr, setPredictionErr] = useState("");

  const [riskProfile, setRiskProfile] = useState<RiskProfile>("Moderate");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr("");

      try {
        const data = await fetchStock(ticker);
        setStock(data);
      } catch (e: any) {
        setStock(null);
        setErr(e?.response?.data?.error ?? "Failed to fetch stock data");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [ticker]);

  useEffect(() => {
    const run = async () => {
      setHistoryLoading(true);
      setHistoryErr("");

      try {
        const data = await fetchHistory(ticker, selectedRange);
        setHistorySeries(data.series ?? []);
      } catch (e: any) {
        setHistorySeries([]);
        setHistoryErr(
          e?.response?.data?.error ?? "Failed to fetch historical data"
        );
      } finally {
        setHistoryLoading(false);
      }
    };

    run();
  }, [ticker, selectedRange]);

  useEffect(() => {
    const run = async () => {
      setPredictionErr("");

      try {
        const data = await fetchPrediction(ticker, riskProfile);
        setPrediction(data);
      } catch (e: any) {
        setPrediction(null);
        setPredictionErr(
          e?.response?.data?.error ?? "Failed to fetch prediction"
        );
      }
    };

    run();
  }, [ticker, riskProfile]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setSentErr("");

      try {
        const data = await fetchSentiment(ticker);
        if (alive) setSentiment(data);
      } catch (e: any) {
        if (alive) {
          setSentiment(null);
          setSentErr(e?.response?.data?.error ?? "Failed to fetch sentiment");
        }
      }
    };

    load();
    const id = window.setInterval(load, 30000);

    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [ticker]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setIndErr("");

      try {
        const data = await fetchIndicators(ticker);
        if (alive) setIndicators(data);
      } catch (e: any) {
        if (alive) {
          setIndicators(null);
          setIndErr(e?.response?.data?.error ?? "Failed to fetch indicators");
        }
      }
    };

    load();
    const id = window.setInterval(load, 30000);

    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [ticker]);

  const overview = {
    ticker: stock?.ticker ?? ticker,
    name: stock?.name ?? "Example Company",
    price: stock?.price ?? 182.45,
    change: stock?.change ?? 2.13,
    changePct: stock?.changePct ?? 1.18,
    updatedAt: stock?.updatedAt ?? nowTimeString(),
    marketStatus: "Open" as const,
  };

  const latestRsi =
    indicators?.rsi14
      ?.slice()
      .reverse()
      .find((v: number | null) => v != null) ?? 50;

  const latestSma20 =
    indicators?.sma20
      ?.slice()
      .reverse()
      .find((v: number | null) => v != null);

  const latestSma50 =
    indicators?.sma50
      ?.slice()
      .reverse()
      .find((v: number | null) => v != null);

  let derivedSmaTrend: "Up" | "Down" | "Flat" = "Flat";

  if (latestSma20 != null && latestSma50 != null) {
    if (latestSma20 > latestSma50) {
      derivedSmaTrend = "Up";
    } else if (latestSma20 < latestSma50) {
      derivedSmaTrend = "Down";
    }
  }

  const handleAddWatchlist = async () => {
    try {
      const userId = 1;

      const watchlists = await fetchUserWatchlists(userId);

      if (!watchlists.length) {
        alert("No watchlist found for this user.");
        return;
      }

      const defaultWatchlistId = watchlists[0].id;

      await addToWatchlist(defaultWatchlistId, ticker);

      alert(`${ticker} added to watchlist`);
    } catch {
      alert("Failed to add to watchlist");
    }
  };

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

      {loading && (
        <div style={{ marginTop: 12, color: "var(--muted)" }}>Loading...</div>
      )}
      {err && <div style={{ marginTop: 12, color: "var(--red)" }}>{err}</div>}

      <div style={{ marginTop: 14 }}>
        <PriceOverviewCard {...overview} />
      </div>

      <div className="dashboardGrid" style={{ marginTop: 18 }}>
        <div className="span12">
          {historyLoading && (
            <div style={{ marginBottom: 10, color: "var(--muted)" }}>
              Loading historical data...
            </div>
          )}

          {historyErr && (
            <div style={{ marginBottom: 10, color: "var(--red)" }}>
              {historyErr}
            </div>
          )}

          <HistoricalChartCard
            series={historySeries}
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
          />
        </div>

        <div className="spanLeftTop">
          {indErr && (
            <div style={{ marginBottom: 10, color: "var(--red)" }}>
              {indErr}
            </div>
          )}

          <TechnicalIndicatorsCard
            rsi={latestRsi}
            smaTrend={derivedSmaTrend}
          />
        </div>

        <div className="spanRightTall">
          {predictionErr && (
            <div style={{ marginBottom: 10, color: "var(--red)" }}>
              {predictionErr}
            </div>
          )}

          <PredictionCard
            horizon={prediction?.horizon ?? "7-day"}
            trend={prediction?.trend ?? "Stable"}
            confidence={prediction?.confidence ?? 0}
            sentimentLabel={prediction?.sentimentLabel}
            sentimentScore={prediction?.sentimentScore}
            interpretation={prediction?.interpretation}
            suggestedAction={prediction?.suggestedAction}
            actionReason={prediction?.actionReason}
            explanation={prediction?.explanation}
            riskMessage={prediction?.riskMessage}
            risk={riskProfile}
            onChangeRisk={setRiskProfile}
          />
        </div>

        <div className="spanLeftBottom" style={{ minHeight: "100%" }}>
          {sentErr && (
            <div style={{ marginBottom: 10, color: "var(--red)" }}>
              {sentErr}
            </div>
          )}

          <div style={{ height: "100%" }}>
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
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <Card title="Actions">
          <div className="rowWrap">
            <button className="btn" onClick={handleAddWatchlist}>
              ★ Add to Watchlist
            </button>

            {riskProfile === "Conservative" ? (
              <button className="btn">⚠ Review Risk</button>
            ) : (
              <button className="btn">⏰ Set Alert</button>
            )}

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