// const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface StockData {
  symbol: string;
  price: number;
  change: number;
}

export async function getStock(symbol: string): Promise<StockData> {
  // Mock data for now (Week 1)
  return {
    symbol,
    price: 180.25,
    change: 1.32,
  };

  // Real backend call will replace this later
  // const res = await fetch(`${BASE_URL}/api/stock/${symbol}`);
  // if (!res.ok) throw new Error("Failed to fetch stock");
  // return res.json();
}
