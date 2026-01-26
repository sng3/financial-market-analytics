export interface StockOverview {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export async function getStockOverview(symbol: string): Promise<StockOverview> {
  const s = symbol.trim().toUpperCase();

  // Mock for now. Replace with real Flask call later.
  return {
    symbol: s,
    price: 180.25,
    change: 1.32,
    changePercent: 0.74,
  };
}
