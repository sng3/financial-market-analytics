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
  score: number;        // -1..1
  confidence: number;   // 0..1
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

export type IndicatorsResponse = {
  ticker: string;
  rsi: number | null;
  sma20: number | null;
  sma50: number | null;
  smaTrend: "Up" | "Down" | "Neutral";
  updatedAt: string;
};

export async function fetchIndicators(ticker: string): Promise<IndicatorsResponse> {
  const res = await axios.get(`${API_BASE}/api/indicators`, { params: { ticker } });
  return res.data as IndicatorsResponse;
}