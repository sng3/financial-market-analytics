import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getStock } from "../services/api";
import type { StockData } from "../services/api";

export default function Stock() {
  const { symbol } = useParams();
  const [data, setData] = useState<StockData | null>(null);

  useEffect(() => {
    if (!symbol) return;
    getStock(symbol).then(setData);
  }, [symbol]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Stock</h2>

      {!data ? (
        <p>Loading...</p>
      ) : (
        <>
          <p>
            Symbol: <b>{data.symbol}</b>
          </p>
          <p>Price: ${data.price}</p>
          <p>Change: {data.change}</p>
        </>
      )}
    </div>
  );
}
