// import { useEffect, useMemo, useState } from "react";
// import { useSearchParams, useNavigate } from "react-router-dom";

// import {
//   fetchStock,
//   fetchSentiment,
//   fetchIndicators,
//   fetchHistory,
//   fetchPrediction,
//   addToWatchlist,
//   fetchUserWatchlists,
//   checkUserAlerts,
//   fetchProfile,
//   fetchRecommendations,
// } from "../services/api";

// import type {
//   StockResponse,
//   SentimentResponse,
//   IndicatorsResponse,
//   HistoryPoint,
//   PredictionResponse,
//   RecommendationsResponse,
// } from "../services/api";

// import type { UserProfile } from "../types/user";

// import StockSearchBar from "../components/StockSearchBar";
// import PriceOverviewCard from "../components/PriceOverviewCard";
// import HistoricalChartCard, {
//   type HistoryRange,
// } from "../components/HistoricalChartCard";
// import TechnicalIndicatorsCard from "../components/TechnicalIndicatorsCard";
// import SentimentCard from "../components/SentimentCard";
// import PredictionCard from "../components/PredictionCard";
// import ExportModal from "../components/ExportModal";
// import Card from "../components/Card";

// import {
//   exportDashboardPDF,
//   exportDashboardExcel,
// } from "../services/exportService";

// type RiskProfile = "Conservative" | "Moderate" | "Aggressive";

// const EMPTY_INDICATORS: IndicatorsResponse = {
//   ticker: "",
//   period: "6mo",
//   interval: "1d",
//   timestamps: [],
//   close: [],
//   sma20: [],
//   sma50: [],
//   rsi14: [],
//   updatedAt: 0,
// };

// export default function DashboardPage() {
//   const [params] = useSearchParams();
//   const nav = useNavigate();

//   const urlTicker = params.get("t")?.toUpperCase();
//   const savedTicker = localStorage.getItem("lastDashboardTicker")?.toUpperCase();
//   const initialTicker = urlTicker || savedTicker || "AAPL";

//   const [ticker, setTicker] = useState(initialTicker);
//   const [exportOpen, setExportOpen] = useState(false);

//   const [stock, setStock] = useState<StockResponse | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState("");

//   const [sentiment, setSentiment] = useState<SentimentResponse | null>(null);
//   const [sentErr, setSentErr] = useState("");

//   const [indicators, setIndicators] = useState<IndicatorsResponse | null>(null);
//   const [indErr, setIndErr] = useState("");

//   const [historySeries, setHistorySeries] = useState<HistoryPoint[]>([]);
//   const [historyErr, setHistoryErr] = useState("");
//   const [historyLoading, setHistoryLoading] = useState(false);
//   const [selectedRange, setSelectedRange] = useState<HistoryRange>("1Y");

//   const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
//   const [predictionErr, setPredictionErr] = useState("");

//   const [riskProfile, setRiskProfile] = useState<RiskProfile>("Moderate");

//   const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
//   const [recommendations, setRecommendations] =
//     useState<RecommendationsResponse | null>(null);
//   const [recommendationsErr, setRecommendationsErr] = useState("");
//   const [recommendationsLoading, setRecommendationsLoading] = useState(false);

//   useEffect(() => {
//     const nextTicker =
//       params.get("t")?.toUpperCase() ||
//       localStorage.getItem("lastDashboardTicker")?.toUpperCase() ||
//       "AAPL";

//     setTicker(nextTicker);
//   }, [params]);

//   useEffect(() => {
//     localStorage.setItem("lastDashboardTicker", ticker);
//   }, [ticker]);

//   useEffect(() => {
//     const loadUserProfile = async () => {
//       const raw = localStorage.getItem("user");
//       if (!raw) {
//         setUserProfile(null);
//         return;
//       }

//       try {
//         const parsed = JSON.parse(raw);
//         const userId = parsed?.id as number | undefined;

//         if (!userId) {
//           setUserProfile(null);
//           return;
//         }

//         const freshProfile = await fetchProfile(userId);
//         setUserProfile(freshProfile);
//         setRiskProfile(freshProfile.riskTolerance);
//       } catch (error) {
//         console.error("Failed to load profile for dashboard:", error);
//         setUserProfile(null);
//       }
//     };

//     loadUserProfile();
//   }, []);

//   useEffect(() => {
//     if (!userProfile) {
//       setRecommendations(null);
//       setRecommendationsErr("");
//       return;
//     }

//     const loadRecommendations = async () => {
//       setRecommendationsLoading(true);
//       setRecommendationsErr("");

//       try {
//         const data = await fetchRecommendations(userProfile.id);
//         setRecommendations(data);
//       } catch (error) {
//         console.error("Failed to load recommendations:", error);
//         setRecommendationsErr("Failed to load personalized recommendations.");
//         setRecommendations(null);
//       } finally {
//         setRecommendationsLoading(false);
//       }
//     };

//     loadRecommendations();
//   }, [userProfile]);

//   useEffect(() => {
//     if (!userProfile) return;

//     if (userProfile.horizon === "< 1 Year") {
//       setSelectedRange("1M");
//       return;
//     }

//     if (userProfile.horizon === "1 - 5 Years") {
//       setSelectedRange("1Y");
//       return;
//     }

//     if (userProfile.horizon === "5+ Years") {
//       setSelectedRange("MAX");
//     }
//   }, [userProfile]);

//   useEffect(() => {
//     const run = async () => {
//       setLoading(true);
//       setErr("");
//       setStock(null);

//       try {
//         const data = await fetchStock(ticker);
//         setStock(data);
//       } catch (e: any) {
//         setErr(e?.response?.data?.error ?? "Failed to fetch stock data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     run();
//   }, [ticker]);

//   useEffect(() => {
//     const run = async () => {
//       setHistoryLoading(true);
//       setHistoryErr("");
//       setHistorySeries([]);

//       try {
//         const data = await fetchHistory(ticker, selectedRange);
//         setHistorySeries(data.series ?? []);
//       } catch (e: any) {
//         setHistoryErr(
//           e?.response?.data?.error ?? "Failed to fetch historical data"
//         );
//       } finally {
//         setHistoryLoading(false);
//       }
//     };

//     run();
//   }, [ticker, selectedRange]);

//   useEffect(() => {
//     const run = async () => {
//       setPredictionErr("");
//       setPrediction(null);

//       try {
//         const data = await fetchPrediction(ticker, riskProfile);
//         setPrediction(data);
//       } catch (e: any) {
//         setPredictionErr(
//           e?.response?.data?.error ?? "Failed to fetch prediction"
//         );
//         setPrediction({
//           ticker,
//           horizon: "7-day",
//           trend: "Stable",
//           confidence: 0,
//           featuresUsed: [],
//           sentimentScore: 0,
//           sentimentLabel: "Neutral",
//           explanation: "Prediction is temporarily unavailable.",
//           interpretation:
//             "The model could not generate a reliable forecast with the currently available data.",
//           suggestedAction: "Watchlist",
//           actionReason:
//             "Please review the stock manually until enough valid data is available.",
//           riskMessage:
//             "Prediction is unavailable, so decisions should not rely on this signal alone.",
//         });
//       }
//     };

//     run();
//   }, [ticker, riskProfile]);

//   useEffect(() => {
//     let alive = true;

//     const load = async () => {
//       setSentErr("");

//       try {
//         const data = await fetchSentiment(ticker);
//         if (!alive) return;
//         setSentiment(data);
//       } catch (e: any) {
//         if (!alive) return;

//         setSentErr(e?.response?.data?.error ?? "Failed to fetch sentiment");
//         setSentiment({
//           ticker,
//           label: "Neutral",
//           score: 0,
//           confidence: 0,
//           updatedAt: "",
//           items: [],
//           health: {
//             provider: "none",
//             status: "error",
//             warning: "Sentiment data is temporarily unavailable.",
//           },
//         });
//       }
//     };

//     load();
//     const id = window.setInterval(load, 30000);

//     return () => {
//       alive = false;
//       window.clearInterval(id);
//     };
//   }, [ticker]);

//   useEffect(() => {
//     let alive = true;

//     const load = async () => {
//       setIndErr("");

//       try {
//         const data = await fetchIndicators(ticker);
//         if (!alive) return;
//         setIndicators(data ?? { ...EMPTY_INDICATORS, ticker });
//       } catch (e: any) {
//         if (!alive) return;
//         console.error("Indicator fetch error:", e);
//         setIndicators({ ...EMPTY_INDICATORS, ticker });
//         setIndErr("");
//       }
//     };

//     load();
//     const id = window.setInterval(load, 30000);

//     return () => {
//       alive = false;
//       window.clearInterval(id);
//     };
//   }, [ticker]);

//   useEffect(() => {
//     const raw = localStorage.getItem("user");
//     if (!raw) return;

//     let userId: number | null = null;

//     try {
//       const parsed = JSON.parse(raw);
//       userId = parsed?.id ?? null;
//     } catch {
//       userId = null;
//     }

//     if (!userId) return;

//     let alive = true;

//     const runCheck = async () => {
//       try {
//         await checkUserAlerts(userId);
//       } catch (error) {
//         if (!alive) return;
//         console.error("Alert check failed:", error);
//       }
//     };

//     runCheck();
//     const intervalId = window.setInterval(runCheck, 60000);

//     return () => {
//       alive = false;
//       window.clearInterval(intervalId);
//     };
//   }, []);

//   const latestRsi =
//     indicators?.rsi14
//       ?.slice()
//       .reverse()
//       .find((v: number | null) => v != null) ?? null;

//   const latestSma20 =
//     indicators?.sma20
//       ?.slice()
//       .reverse()
//       .find((v: number | null) => v != null) ?? null;

//   const latestSma50 =
//     indicators?.sma50
//       ?.slice()
//       .reverse()
//       .find((v: number | null) => v != null) ?? null;

//   let derivedSmaTrend: "Up" | "Down" | "Flat" = "Flat";

//   if (latestSma20 != null && latestSma50 != null) {
//     if (latestSma20 > latestSma50) {
//       derivedSmaTrend = "Up";
//     } else if (latestSma20 < latestSma50) {
//       derivedSmaTrend = "Down";
//     }
//   }

//   const primarySector = useMemo(() => {
//     if (!userProfile?.favoriteSectors?.length) return "None";
//     return userProfile.favoriteSectors[0];
//   }, [userProfile]);

//   const handleAddWatchlist = async () => {
//     try {
//       const userRaw = localStorage.getItem("user");

//       if (!userRaw) {
//         alert("Please log in first.");
//         nav("/login");
//         return;
//       }

//       const user = JSON.parse(userRaw);
//       const userId = user.id as number | undefined;

//       if (!userId) {
//         alert("User session is missing.");
//         return;
//       }

//       const watchlists = await fetchUserWatchlists(userId);

//       if (!watchlists.length) {
//         alert("No watchlist found for this user.");
//         return;
//       }

//       const watchlistId = watchlists[0].id;
//       const res = await addToWatchlist(watchlistId, ticker);

//       if (res.ok) {
//         alert(`${ticker} added to watchlist`);
//       } else {
//         alert(`${ticker} is already in watchlist`);
//       }
//     } catch (watchlistError) {
//       console.error(watchlistError);
//       alert("Failed to add to watchlist");
//     }
//   };

//   const handleSelectRecommendedTicker = (nextTicker: string) => {
//     const next = nextTicker.toUpperCase();
//     setTicker(next);
//     localStorage.setItem("lastDashboardTicker", next);
//     nav(`/dashboard?t=${encodeURIComponent(next)}`);
//   };

//   const handleExport = async (type: "pdf" | "excel") => {
//     try {
//       setExportOpen(false);
//       await new Promise((resolve) => setTimeout(resolve, 300));

//       const exportPayload = {
//         ticker,
//         companyName: stock?.name ?? "",

//         profile: userProfile
//           ? {
//               riskTolerance: userProfile.riskTolerance,
//               experience: userProfile.experience,
//               goal: userProfile.goal,
//               horizon: userProfile.horizon,
//               favoriteSectors: userProfile.favoriteSectors,
//             }
//           : null,

//         stock: {
//           price: stock?.price ?? null,
//           change: stock?.change ?? null,
//           changePct: stock?.changePct ?? null,
//           updatedAt: stock?.updatedAt ?? null,
//           marketStatus: stock?.marketStatus ?? null,
//           atCloseUpdatedAt: stock?.atCloseUpdatedAt ?? null,
//           extendedLabel: stock?.extendedLabel ?? null,
//           extendedPrice: stock?.extendedPrice ?? null,
//           extendedChange: stock?.extendedChange ?? null,
//           extendedChangePct: stock?.extendedChangePct ?? null,
//           extendedUpdatedAt: stock?.extendedUpdatedAt ?? null,
//         },

//         sentiment: {
//           label: sentiment?.label ?? null,
//           score: sentiment?.score ?? null,
//           confidence: sentiment?.confidence ?? null,
//           provider: sentiment?.health?.provider ?? null,
//           status: sentiment?.health?.status ?? null,
//           warning: sentiment?.health?.warning ?? null,
//           items: (sentiment?.items ?? []).map((item) => ({
//             title: item.title ?? "",
//             publisher: item.publisher ?? "",
//             score: item.score ?? null,
//             publishedAt:
//               typeof item.publishedAt === "number"
//                 ? new Date(item.publishedAt * 1000).toISOString()
//                 : item.publishedAt ?? null,
//             url: item.url ?? null,
//             imageUrl: item.imageUrl ?? null,
//           })),
//         },

//         indicators: {
//           latestRsi,
//           smaTrend: derivedSmaTrend,
//           latestSma20,
//           latestSma50,
//           timestamps: indicators?.timestamps ?? [],
//           close: indicators?.close ?? [],
//           sma20: indicators?.sma20 ?? [],
//           sma50: indicators?.sma50 ?? [],
//           rsi14: indicators?.rsi14 ?? [],
//         },

//         prediction: {
//           riskProfile,
//           horizon: prediction?.horizon ?? null,
//           trend: prediction?.trend ?? null,
//           confidence: prediction?.confidence ?? null,
//           sentimentLabel: prediction?.sentimentLabel ?? null,
//           sentimentScore: prediction?.sentimentScore ?? null,
//           interpretation: prediction?.interpretation ?? null,
//           suggestedAction: prediction?.suggestedAction ?? null,
//           actionReason: prediction?.actionReason ?? null,
//           explanation: prediction?.explanation ?? null,
//           riskMessage: prediction?.riskMessage ?? null,
//         },

//         recommendations: recommendations
//           ? {
//               summary: recommendations.summary,
//               items: recommendations.items,
//             }
//           : null,

//         history: historySeries.map((point) => ({
//           date: point.t ?? "",
//           close: point.v ?? null,
//         })),

//         generatedAt: new Date().toLocaleString(),
//       };

//       if (type === "pdf") {
//         await exportDashboardPDF(exportPayload);
//         return;
//       }

//       await exportDashboardExcel(exportPayload);
//     } catch (exportError) {
//       console.error("Export failed:", exportError);
//       alert("Failed to export dashboard report");
//     }
//   };

//   return (
//     <div className="container">
//       <div style={{ margin: "14px 0" }}>
//         <StockSearchBar
//           onSelectTicker={(t) => {
//             const next = t.toUpperCase();
//             setTicker(next);
//             localStorage.setItem("lastDashboardTicker", next);
//             nav(`/dashboard?t=${encodeURIComponent(next)}`);
//           }}
//           buttonLabel="Search"
//         />
//       </div>

//       {loading && (
//         <div style={{ marginTop: 12, color: "var(--muted)" }}>Loading...</div>
//       )}

//       {err && <div style={{ marginTop: 12, color: "var(--red)" }}>{err}</div>}

//       <div style={{ marginTop: 14 }}>
//         <PriceOverviewCard
//           ticker={stock?.ticker ?? ticker}
//           name={stock?.name ?? ticker}
//           price={stock?.price ?? 0}
//           change={stock?.change ?? 0}
//           changePct={stock?.changePct ?? 0}
//           updatedAt={stock?.updatedAt ?? new Date().toISOString()}
//           marketStatus={stock?.marketStatus ?? "Closed"}
//           atCloseUpdatedAt={stock?.atCloseUpdatedAt ?? null}
//           extendedLabel={stock?.extendedLabel ?? null}
//           extendedPrice={stock?.extendedPrice ?? null}
//           extendedChange={stock?.extendedChange ?? null}
//           extendedChangePct={stock?.extendedChangePct ?? null}
//           extendedUpdatedAt={stock?.extendedUpdatedAt ?? null}
//         />
//       </div>

//       <div style={{ marginTop: 18 }}>
//         <Card title="Personalized Insights">
//           {!userProfile ? (
//             <div style={{ color: "var(--muted)" }}>
//               Log in to view personalized recommendations.
//             </div>
//           ) : (
//             <div style={{ display: "grid", gap: 12 }}>
//               <div
//                 style={{
//                   display: "flex",
//                   flexWrap: "wrap",
//                   gap: 8,
//                 }}
//               >
//                 <span className="badge">Risk: {userProfile.riskTolerance}</span>
//                 <span className="badge">Goal: {userProfile.goal}</span>
//                 <span className="badge">Horizon: {userProfile.horizon}</span>
//                 <span className="badge">Sector: {primarySector}</span>
//               </div>

//               {recommendationsLoading && (
//                 <div style={{ color: "var(--muted)", fontSize: 14 }}>
//                   Loading personalized recommendations...
//                 </div>
//               )}

//               {recommendationsErr && (
//                 <div style={{ color: "var(--red)", fontSize: 14 }}>
//                   {recommendationsErr}
//                 </div>
//               )}

//               {recommendations && (
//                 <>
//                   <div style={{ color: "var(--muted)", fontSize: 14 }}>
//                     {recommendations.summary}
//                   </div>

//                   <div
//                     style={{
//                       display: "grid",
//                       gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
//                       gap: 10,
//                     }}
//                   >
//                     {recommendations.items.map((item) => (
//                       <button
//                         key={item.ticker}
//                         type="button"
//                         onClick={() => handleSelectRecommendedTicker(item.ticker)}
//                         style={{
//                           textAlign: "left",
//                           border: "1px solid var(--border)",
//                           background: "rgba(255,255,255,0.02)",
//                           color: "var(--text)",
//                           borderRadius: 12,
//                           padding: 12,
//                           cursor: "pointer",
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                             gap: 8,
//                             marginBottom: 8,
//                           }}
//                         >
//                           <div style={{ fontWeight: 800, fontSize: 15 }}>
//                             {item.ticker}
//                           </div>
//                           <span className="badge">{item.sector}</span>
//                         </div>

//                         <div
//                           style={{
//                             fontSize: 13,
//                             color: "var(--muted)",
//                             marginBottom: 8,
//                             whiteSpace: "nowrap",
//                             overflow: "hidden",
//                             textOverflow: "ellipsis",
//                           }}
//                         >
//                           {item.name}
//                         </div>

//                         <div style={{ fontSize: 13, marginBottom: 4 }}>
//                           <strong>
//                             {item.price != null ? `$${item.price.toFixed(2)}` : "N/A"}
//                           </strong>
//                         </div>

//                         <div
//                           style={{
//                             fontSize: 13,
//                             color:
//                               item.changePct != null
//                                 ? item.changePct >= 0
//                                   ? "var(--green)"
//                                   : "var(--red)"
//                                 : "var(--muted)",
//                           }}
//                         >
//                           {item.changePct != null
//                             ? `${item.changePct.toFixed(2)}%`
//                             : "N/A"}
//                         </div>
//                       </button>
//                     ))}
//                   </div>
//                 </>
//               )}
//             </div>
//           )}
//         </Card>
//       </div>

//       <div className="dashboardGrid" style={{ marginTop: 18 }}>
//         <div className="span12">
//           {historyLoading && (
//             <div style={{ marginBottom: 10, color: "var(--muted)" }}>
//               Loading historical data...
//             </div>
//           )}

//           {historyErr && (
//             <div style={{ marginBottom: 10, color: "var(--red)" }}>
//               {historyErr}
//             </div>
//           )}

//           <HistoricalChartCard
//             series={historySeries}
//             selectedRange={selectedRange}
//             onRangeChange={setSelectedRange}
//           />
//         </div>

//         <div className="spanLeftTop">
//           {indErr && (
//             <div style={{ marginBottom: 10, color: "var(--red)" }}>
//               {indErr}
//             </div>
//           )}

//           <TechnicalIndicatorsCard
//             rsi={latestRsi}
//             smaTrend={derivedSmaTrend}
//           />
//         </div>

//         <div className="spanRightTall">
//           {predictionErr && (
//             <div style={{ marginBottom: 10, color: "var(--red)" }}>
//               {predictionErr}
//             </div>
//           )}

//           <PredictionCard
//             horizon={prediction?.horizon ?? "7-day"}
//             trend={prediction?.trend ?? "Stable"}
//             confidence={prediction?.confidence ?? 0}
//             sentimentLabel={prediction?.sentimentLabel}
//             sentimentScore={prediction?.sentimentScore}
//             interpretation={prediction?.interpretation}
//             suggestedAction={prediction?.suggestedAction}
//             actionReason={prediction?.actionReason}
//             explanation={prediction?.explanation}
//             riskMessage={prediction?.riskMessage}
//             risk={riskProfile}
//             onChangeRisk={setRiskProfile}
//           />
//         </div>

//         <div className="spanLeftBottom" style={{ minHeight: "100%" }}>
//           {sentErr && (
//             <div style={{ marginBottom: 10, color: "var(--red)" }}>
//               {sentErr}
//             </div>
//           )}

//           <div style={{ height: "100%" }}>
//             <SentimentCard
//               label={sentiment?.label ?? "Neutral"}
//               score={sentiment?.score ?? 0}
//               confidence={sentiment?.confidence ?? 0}
//               items={(sentiment?.items ?? []).map((x) => {
//                 const publishedAt =
//                   typeof x.publishedAt === "number"
//                     ? new Date(x.publishedAt * 1000).toISOString()
//                     : x.publishedAt ?? null;

//                 return {
//                   title: x.title,
//                   url: x.url,
//                   imageUrl: x.imageUrl,
//                   score: x.score,
//                   publisher: x.publisher,
//                   publishedAt,
//                 };
//               })}
//               health={
//                 sentiment?.health ?? {
//                   provider: "none",
//                   status: "error",
//                   warning: "No data",
//                 }
//               }
//             />
//           </div>
//         </div>
//       </div>

//       <div style={{ marginTop: 18 }}>
//         <Card title="Actions">
//           <div className="rowWrap">
//             <button className="btn btnPrimary" onClick={handleAddWatchlist}>
//               ★ Add to Watchlist
//             </button>

//             <button
//               className="btn"
//               onClick={() => nav(`/alerts?t=${encodeURIComponent(ticker)}`)}
//             >
//               ⏰ Set Alert
//             </button>

//             <button
//               className="btn btnPrimary"
//               onClick={() => setExportOpen(true)}
//             >
//               ⬇ Export
//             </button>
//           </div>
//         </Card>
//       </div>

//       <div style={{ marginTop: 14, color: "var(--muted2)", fontSize: 13 }}>
//         Educational use only. Not financial advice. All investment decisions are
//         made at your own risk.
//       </div>

//       <ExportModal
//         open={exportOpen}
//         onClose={() => setExportOpen(false)}
//         onExport={handleExport}
//       />
//     </div>
//   );
// }

import { useEffect, useMemo, useState } from "react";
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
  fetchProfile,
  fetchRecommendations,
} from "../services/api";

import type {
  StockResponse,
  SentimentResponse,
  IndicatorsResponse,
  HistoryPoint,
  PredictionResponse,
  RecommendationsResponse,
} from "../services/api";

import type { UserProfile } from "../types/user";

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

  const [riskProfile, setRiskProfile] = useState<RiskProfile>("Moderate");

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] =
    useState<RecommendationsResponse | null>(null);
  const [recommendationsErr, setRecommendationsErr] = useState("");
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const loadUserProfile = async () => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      setUserProfile(null);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const userId = parsed?.id as number | undefined;

      if (!userId) {
        setUserProfile(null);
        return;
      }

      const freshProfile = await fetchProfile(userId);
      setUserProfile(freshProfile);
      setRiskProfile(freshProfile.riskTolerance);
    } catch (error) {
      console.error("Failed to load profile for dashboard:", error);
      setUserProfile(null);
    }
  };

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
    loadUserProfile();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      loadUserProfile();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "profileUpdatedAt" || event.key === "user") {
        loadUserProfile();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!userProfile) {
      setRecommendations(null);
      setRecommendationsErr("");
      return;
    }

    const loadRecommendations = async () => {
      setRecommendationsLoading(true);
      setRecommendationsErr("");

      try {
        const data = await fetchRecommendations(userProfile.id);
        setRecommendations(data);
      } catch (error) {
        console.error("Failed to load recommendations:", error);
        setRecommendationsErr("Failed to load personalized recommendations.");
        setRecommendations(null);
      } finally {
        setRecommendationsLoading(false);
      }
    };

    loadRecommendations();
  }, [userProfile]);

  useEffect(() => {
    if (!userProfile) return;

    if (userProfile.horizon === "< 1 Year") {
      setSelectedRange("1M");
      return;
    }

    if (userProfile.horizon === "1 - 5 Years") {
      setSelectedRange("1Y");
      return;
    }

    if (userProfile.horizon === "5+ Years") {
      setSelectedRange("MAX");
    }
  }, [userProfile]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr("");
      setStock(null);

      try {
        const data = await fetchStock(ticker);
        setStock(data);
      } catch (e: any) {
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
      setHistorySeries([]);

      try {
        const data = await fetchHistory(ticker, selectedRange);
        setHistorySeries(data.series ?? []);
      } catch (e: any) {
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
      setPrediction(null);

      try {
        const data = await fetchPrediction(ticker, riskProfile);
        setPrediction(data);
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
        if (!alive) return;
        setSentiment(data);
      } catch (e: any) {
        if (!alive) return;

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
        if (!alive) return;
        setIndicators(data ?? { ...EMPTY_INDICATORS, ticker });
      } catch (e: any) {
        if (!alive) return;
        console.error("Indicator fetch error:", e);
        setIndicators({ ...EMPTY_INDICATORS, ticker });
        setIndErr("");
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
        await checkUserAlerts(userId);
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

  const primarySector = useMemo(() => {
    if (!userProfile?.favoriteSectors?.length) return "None";
    return userProfile.favoriteSectors[0];
  }, [userProfile]);

  const handleAddWatchlist = async () => {
    try {
      const userRaw = localStorage.getItem("user");

      if (!userRaw) {
        alert("Please log in first.");
        nav("/login");
        return;
      }

      const user = JSON.parse(userRaw);
      const userId = user.id as number | undefined;

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

  const handleSelectRecommendedTicker = (nextTicker: string) => {
    const next = nextTicker.toUpperCase();
    setTicker(next);
    localStorage.setItem("lastDashboardTicker", next);
    nav(`/dashboard?t=${encodeURIComponent(next)}`);
  };

  const handleExport = async (type: "pdf" | "excel") => {
    try {
      setExportOpen(false);
      await new Promise((resolve) => setTimeout(resolve, 300));

      const exportPayload = {
        ticker,
        companyName: stock?.name ?? "",

        profile: userProfile
          ? {
              riskTolerance: userProfile.riskTolerance,
              experience: userProfile.experience,
              goal: userProfile.goal,
              horizon: userProfile.horizon,
              favoriteSectors: userProfile.favoriteSectors,
            }
          : null,

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

        recommendations: recommendations
          ? {
              summary: recommendations.summary,
              items: recommendations.items,
            }
          : null,

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

      <div style={{ marginTop: 18 }}>
        <Card title="Personalized Insights">
          {!userProfile ? (
            <div style={{ color: "var(--muted)" }}>
              Log in to view personalized recommendations.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <span className="badge">Risk: {userProfile.riskTolerance}</span>
                <span className="badge">Goal: {userProfile.goal}</span>
                <span className="badge">Horizon: {userProfile.horizon}</span>
                <span className="badge">Sector: {primarySector}</span>
              </div>

              {recommendationsLoading && (
                <div style={{ color: "var(--muted)", fontSize: 14 }}>
                  Loading personalized recommendations...
                </div>
              )}

              {recommendationsErr && (
                <div style={{ color: "var(--red)", fontSize: 14 }}>
                  {recommendationsErr}
                </div>
              )}

              {recommendations && (
                <>
                  <div style={{ color: "var(--muted)", fontSize: 14 }}>
                    {recommendations.summary}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {recommendations.items.map((item) => (
                      <button
                        key={item.ticker}
                        type="button"
                        onClick={() => handleSelectRecommendedTicker(item.ticker)}
                        style={{
                          textAlign: "left",
                          border: "1px solid var(--border)",
                          background: "rgba(255,255,255,0.02)",
                          color: "var(--text)",
                          borderRadius: 12,
                          padding: 12,
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: 15 }}>
                            {item.ticker}
                          </div>
                          <span className="badge">{item.sector}</span>
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            color: "var(--muted)",
                            marginBottom: 8,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.name}
                        </div>

                        <div style={{ fontSize: 13, marginBottom: 4 }}>
                          <strong>
                            {item.price != null ? `$${item.price.toFixed(2)}` : "N/A"}
                          </strong>
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            color:
                              item.changePct != null
                                ? item.changePct >= 0
                                  ? "var(--green)"
                                  : "var(--red)"
                                : "var(--muted)",
                          }}
                        >
                          {item.changePct != null
                            ? `${item.changePct.toFixed(2)}%`
                            : "N/A"}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </Card>
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