import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import {
  fetchStock,
  fetchSentiment,
  fetchIndicators,
  fetchHistory,
  fetchPrediction,
  addToWatchlist,
  fetchUserWatchlists,
  checkUserAlerts,
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

import {
  exportDashboardPDF,
  exportDashboardExcel,
} from "../services/exportService";

type RiskProfile = "Conservative" | "Moderate" | "Aggressive";

const EMPTY_INDICATORS: IndicatorsResponse = {
  ticker: "",
  period: "6mo",
  interval: "1d",
  timestamps: [],
  close: [],
  sma20: [],
  sma50: [],
  rsi14: [],
  updatedAt: 0,
};

export default function DashboardPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();

  const urlTicker = params.get("t")?.toUpperCase();
  const savedTicker = localStorage.getItem("lastDashboardTicker")?.toUpperCase();
  const initialTicker = urlTicker || savedTicker || "AAPL";

  const [ticker, setTicker] = useState(initialTicker);
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
  const [predictionLoaded, setPredictionLoaded] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);

  const [riskProfile, setRiskProfile] = useState<RiskProfile>("Moderate");

  const initialLoadKeyRef = useRef<string>("");

  useEffect(() => {
    const nextTicker =
      params.get("t")?.toUpperCase() ||
      localStorage.getItem("lastDashboardTicker")?.toUpperCase() ||
      "AAPL";

    setTicker(nextTicker);
  }, [params]);

  useEffect(() => {
    localStorage.setItem("lastDashboardTicker", ticker);
  }, [ticker]);

  useEffect(() => {
    setPredictionLoaded(false);
    setPrediction(null);
    setPredictionErr("");
  }, [ticker]);

  useEffect(() => {
    let cancelled = false;
    const loadKey = `${ticker}|${selectedRange}`;

    if (initialLoadKeyRef.current === loadKey) return;
    initialLoadKeyRef.current = loadKey;

    const timers: number[] = [];

    const loadStock = async () => {
      setLoading(true);
      setErr("");
      setStock(null);

      try {
        const data = await fetchStock(ticker);
        if (!cancelled) setStock(data);
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.response?.data?.error ?? "Failed to fetch stock data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryErr("");
      setHistorySeries([]);

      try {
        const data = await fetchHistory(ticker, selectedRange);
        if (!cancelled) setHistorySeries(data.series ?? []);
      } catch (e: any) {
        if (!cancelled) {
          setHistoryErr(
            e?.response?.data?.error ?? "Failed to fetch historical data"
          );
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    const loadIndicators = async () => {
      setIndErr("");

      try {
        const data = await fetchIndicators(ticker);
        if (!cancelled) {
          setIndicators(data ?? { ...EMPTY_INDICATORS, ticker });
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error("Indicator fetch error:", e);
          setIndicators({ ...EMPTY_INDICATORS, ticker });
          setIndErr("");
        }
      }
    };

    const loadSentiment = async () => {
      setSentErr("");

      try {
        const data = await fetchSentiment(ticker);
        if (!cancelled) setSentiment(data);
      } catch (e: any) {
        if (!cancelled) {
          setSentErr(e?.response?.data?.error ?? "Failed to fetch sentiment");
          setSentiment({
            ticker,
            label: "Neutral",
            score: 0,
            confidence: 0,
            updatedAt: "",
            items: [],
            health: {
              provider: "none",
              status: "error",
              warning: "Sentiment data is temporarily unavailable.",
            },
          });
        }
      }
    };

    loadStock();
    timers.push(window.setTimeout(loadHistory, 350));
    timers.push(window.setTimeout(loadIndicators, 900));
    timers.push(window.setTimeout(loadSentiment, 1500));

    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
    };
  }, [ticker, selectedRange]);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;

    let userId: number | null = null;

    try {
      const parsed = JSON.parse(raw);
      userId = parsed?.id ?? null;
    } catch {
      userId = null;
    }

    if (!userId) return;

    let alive = true;

    const runCheck = async () => {
      try {
        await checkUserAlerts(userId as number);
      } catch (error) {
        if (!alive) return;
        console.error("Alert check failed:", error);
      }
    };

    runCheck();
    const intervalId = window.setInterval(runCheck, 60000);

    return () => {
      alive = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const loadPrediction = async () => {
    setPredictionLoading(true);
    setPredictionErr("");
    setPrediction(null);

    try {
      const data = await fetchPrediction(ticker, riskProfile);
      setPrediction(data);
      setPredictionLoaded(true);
    } catch (e: any) {
      setPredictionErr(
        e?.response?.data?.error ?? "Failed to fetch prediction"
      );
      setPrediction({
        ticker,
        horizon: "7-day",
        trend: "Stable",
        confidence: 0,
        featuresUsed: [],
        sentimentScore: 0,
        sentimentLabel: "Neutral",
        explanation: "Prediction is temporarily unavailable.",
        interpretation:
          "The model could not generate a reliable forecast with the currently available data.",
        suggestedAction: "Watchlist",
        actionReason:
          "Please review the stock manually until enough valid data is available.",
        riskMessage:
          "Prediction is unavailable, so decisions should not rely on this signal alone.",
      });
      setPredictionLoaded(true);
    } finally {
      setPredictionLoading(false);
    }
  };

  useEffect(() => {
    if (!predictionLoaded) return;
    loadPrediction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskProfile]);

  const latestRsi =
    indicators?.rsi14
      ?.slice()
      .reverse()
      .find((v: number | null) => v != null) ?? null;

  const latestSma20 =
    indicators?.sma20
      ?.slice()
      .reverse()
      .find((v: number | null) => v != null) ?? null;

  const latestSma50 =
    indicators?.sma50
      ?.slice()
      .reverse()
      .find((v: number | null) => v != null) ?? null;

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
      const userRaw = localStorage.getItem("user");

      if (!userRaw) {
        alert("Please log in first.");
        nav("/login");
        return;
      }

      const user = JSON.parse(userRaw);
      const userId = user.id;

      if (!userId) {
        alert("User session is missing.");
        return;
      }

      const watchlists = await fetchUserWatchlists(userId);

      if (!watchlists.length) {
        alert("No watchlist found for this user.");
        return;
      }

      const watchlistId = watchlists[0].id;
      const res = await addToWatchlist(watchlistId, ticker);

      if (res.ok) {
        alert(`${ticker} added to watchlist`);
      } else {
        alert(`${ticker} is already in watchlist`);
      }
    } catch (watchlistError) {
      console.error(watchlistError);
      alert("Failed to add to watchlist");
    }
  };

  const handleExport = async (type: "pdf" | "excel") => {
    try {
      setExportOpen(false);
      await new Promise((resolve) => setTimeout(resolve, 300));

      const exportPayload = {
        ticker,
        companyName: stock?.name ?? "",

        stock: {
          price: stock?.price ?? null,
          change: stock?.change ?? null,
          changePct: stock?.changePct ?? null,
          updatedAt: stock?.updatedAt ?? null,
          marketStatus: stock?.marketStatus ?? null,
          atCloseUpdatedAt: stock?.atCloseUpdatedAt ?? null,
          extendedLabel: stock?.extendedLabel ?? null,
          extendedPrice: stock?.extendedPrice ?? null,
          extendedChange: stock?.extendedChange ?? null,
          extendedChangePct: stock?.extendedChangePct ?? null,
          extendedUpdatedAt: stock?.extendedUpdatedAt ?? null,
        },

        sentiment: {
          label: sentiment?.label ?? null,
          score: sentiment?.score ?? null,
          confidence: sentiment?.confidence ?? null,
          provider: sentiment?.health?.provider ?? null,
          status: sentiment?.health?.status ?? null,
          warning: sentiment?.health?.warning ?? null,
          items: (sentiment?.items ?? []).map((item) => ({
            title: item.title ?? "",
            publisher: item.publisher ?? "",
            score: item.score ?? null,
            publishedAt:
              typeof item.publishedAt === "number"
                ? new Date(item.publishedAt * 1000).toISOString()
                : item.publishedAt ?? null,
            url: item.url ?? null,
            imageUrl: item.imageUrl ?? null,
          })),
        },

        indicators: {
          latestRsi,
          smaTrend: derivedSmaTrend,
          latestSma20,
          latestSma50,
          timestamps: indicators?.timestamps ?? [],
          close: indicators?.close ?? [],
          sma20: indicators?.sma20 ?? [],
          sma50: indicators?.sma50 ?? [],
          rsi14: indicators?.rsi14 ?? [],
        },

        prediction: {
          riskProfile,
          horizon: prediction?.horizon ?? null,
          trend: prediction?.trend ?? null,
          confidence: prediction?.confidence ?? null,
          sentimentLabel: prediction?.sentimentLabel ?? null,
          sentimentScore: prediction?.sentimentScore ?? null,
          interpretation: prediction?.interpretation ?? null,
          suggestedAction: prediction?.suggestedAction ?? null,
          actionReason: prediction?.actionReason ?? null,
          explanation: prediction?.explanation ?? null,
          riskMessage: prediction?.riskMessage ?? null,
        },

        history: historySeries.map((point) => ({
          date: point.t ?? "",
          close: point.v ?? null,
        })),

        generatedAt: new Date().toLocaleString(),
      };

      if (type === "pdf") {
        await exportDashboardPDF(exportPayload);
        return;
      }

      await exportDashboardExcel(exportPayload);
    } catch (exportError) {
      console.error("Export failed:", exportError);
      alert("Failed to export dashboard report");
    }
  };

  return (
    <div className="container">
      <div style={{ margin: "14px 0" }}>
        <StockSearchBar
          onSelectTicker={(t) => {
            const next = t.toUpperCase();
            setTicker(next);
            localStorage.setItem("lastDashboardTicker", next);
            nav(`/dashboard?t=${encodeURIComponent(next)}`);
          }}
          buttonLabel="Search"
        />
      </div>

      {loading && (
        <div style={{ marginTop: 12, color: "var(--muted)" }}>Loading...</div>
      )}

      {err && <div style={{ marginTop: 12, color: "var(--red)" }}>{err}</div>}

      <div style={{ marginTop: 14 }}>
        <PriceOverviewCard
          ticker={stock?.ticker ?? ticker}
          name={stock?.name ?? ticker}
          price={stock?.price ?? 0}
          change={stock?.change ?? 0}
          changePct={stock?.changePct ?? 0}
          updatedAt={stock?.updatedAt ?? new Date().toISOString()}
          marketStatus={stock?.marketStatus ?? "Closed"}
          atCloseUpdatedAt={stock?.atCloseUpdatedAt ?? null}
          extendedLabel={stock?.extendedLabel ?? null}
          extendedPrice={stock?.extendedPrice ?? null}
          extendedChange={stock?.extendedChange ?? null}
          extendedChangePct={stock?.extendedChangePct ?? null}
          extendedUpdatedAt={stock?.extendedUpdatedAt ?? null}
        />
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

          {!predictionLoaded ? (
            <Card title="Prediction">
              <div className="rowWrap">
                <button
                  className="btn btnPrimary"
                  onClick={loadPrediction}
                  disabled={predictionLoading}
                >
                  {predictionLoading ? "Loading Prediction..." : "Load Prediction"}
                </button>
              </div>
              <div style={{ marginTop: 10, color: "var(--muted)" }}>
                Prediction is loaded on demand to keep the dashboard responsive.
              </div>
            </Card>
          ) : (
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
          )}
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
            <button className="btn btnPrimary" onClick={handleAddWatchlist}>
              ★ Add to Watchlist
            </button>

            <button
              className="btn"
              onClick={() => nav(`/alerts?t=${encodeURIComponent(ticker)}`)}
            >
              ⏰ Set Alert
            </button>

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
        onExport={handleExport}
      />
    </div>
  );
}