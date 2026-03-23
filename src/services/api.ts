import axios from "axios";

const API_BASE = "http://127.0.0.1:5000";

/* =========================
   Stock
========================= */
export type StockResponse = {
  ticker: string;
  name: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  updatedAt: string;
};

export async function fetchStock(ticker: string): Promise<StockResponse> {
  const res = await axios.get(`${API_BASE}/api/stock`, {
    params: { ticker },
  });
  return res.data as StockResponse;
}

/* =========================
   Search
========================= */
export type SearchResult = {
  ticker: string;
  name: string;
};

export async function searchStocks(q: string): Promise<SearchResult[]> {
  const res = await axios.get(`${API_BASE}/api/search`, {
    params: { q },
  });
  return res.data as SearchResult[];
}

/* =========================
   Sentiment
========================= */
export type SentimentItem = {
  title: string;
  score: number;
  publisher: string;
  publishedAt: string | number | null;
  url: string;
  imageUrl: string;
};

export type SentimentHealth = {
  provider: "newsapi" | "yfinance" | "none";
  status: "ok" | "rate_limited" | "error";
  warning: string;
};

export type SentimentResponse = {
  ticker: string;
  label: "Positive" | "Neutral" | "Negative";
  score: number;
  confidence: number;
  updatedAt: string;
  items: SentimentItem[];
  health: SentimentHealth;
};

export async function fetchSentiment(
  ticker: string
): Promise<SentimentResponse> {
  const res = await axios.get(`${API_BASE}/api/sentiment`, {
    params: { ticker },
  });
  return res.data as SentimentResponse;
}

/* =========================
   Indicators
========================= */
export type IndicatorsResponse = {
  ticker: string;
  period: string;
  interval: string;
  timestamps: string[];
  close: number[];
  sma20: Array<number | null>;
  sma50: Array<number | null>;
  rsi14: Array<number | null>;
  updatedAt: number;
};

export async function fetchIndicators(
  ticker: string
): Promise<IndicatorsResponse> {
  const res = await axios.get(`${API_BASE}/api/indicator_series`, {
    params: { ticker, period: "6mo", interval: "1d" },
  });
  return res.data as IndicatorsResponse;
}

/* =========================
   History
========================= */
export type HistoryPoint = {
  t: string;
  v: number;
};

export type HistoryResponse = {
  ticker: string;
  range: string;
  series: HistoryPoint[];
};

export async function fetchHistory(
  ticker: string,
  range: string = "1Y"
): Promise<HistoryResponse> {
  const res = await axios.get(`${API_BASE}/api/history`, {
    params: { ticker, range },
  });
  return res.data as HistoryResponse;
}

/* =========================
   Prediction
========================= */
export type PredictionResponse = {
  ticker: string;
  horizon: string;
  trend: "Up" | "Down" | "Stable";
  confidence: number;
  featuresUsed: string[];
  sentimentScore: number;
  sentimentLabel: "Positive" | "Neutral" | "Negative";
  explanation: string;
  interpretation: string;
  suggestedAction: "Opportunity" | "Watchlist" | "Caution";
  actionReason: string;
  riskMessage: string;
};

export async function fetchPrediction(
  ticker: string,
  risk: "Conservative" | "Moderate" | "Aggressive" = "Moderate"
): Promise<PredictionResponse> {
  const res = await axios.get(`${API_BASE}/api/prediction`, {
    params: { ticker, risk },
  });
  return res.data as PredictionResponse;
}

/* =========================
   Watchlists
========================= */
export type Watchlist = {
  id: number;
  user_id: number;
  name: string;
};

export async function fetchUserWatchlists(userId: number): Promise<Watchlist[]> {
  const res = await axios.get(`${API_BASE}/api/users/${userId}/watchlists`);
  return res.data.watchlists as Watchlist[];
}

export async function addToWatchlist(watchlistId: number, ticker: string) {
  const res = await axios.post(
    `${API_BASE}/api/watchlists/${watchlistId}/tickers`,
    { ticker }
  );
  return res.data;
}