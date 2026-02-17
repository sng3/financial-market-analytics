import axios from "axios";

const API_BASE = "http://127.0.0.1:5000";

export type StockResponse = {
  ticker: string;
  name: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  updatedAt: string;
};

export type SearchResult = {
  ticker: string;
  name: string;
};

export async function fetchStock(ticker: string): Promise<StockResponse> {
  const res = await axios.get(`${API_BASE}/api/stock`, { params: { ticker } });
  return res.data as StockResponse;
}

export async function searchStocks(q: string): Promise<SearchResult[]> {
  const res = await axios.get(`${API_BASE}/api/search`, { params: { q } });
  return res.data as SearchResult[];
}