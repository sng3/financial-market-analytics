import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WatchlistTable from "../components/WatchlistTable";
import StockSearchBar from "../components/StockSearchBar";
import {
  fetchUserWatchlists,
  fetchWatchlistTickers,
  fetchStock,
  addToWatchlist,
  removeFromWatchlist,
} from "../services/api";

type WatchlistItem = {
  ticker: string;
  price: number;
  changePct: number;
};

export default function WatchlistPage() {
  const nav = useNavigate();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlistId, setWatchlistId] = useState<number | null>(null);

  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const userRaw = localStorage.getItem("user");

        if (!userRaw) {
          nav("/login");
          return;
        }

        const user = JSON.parse(userRaw);
        const userId = user.id;

        if (!userId) {
          nav("/login");
          return;
        }

        const watchlists = await fetchUserWatchlists(userId);

        if (!watchlists.length) {
          setItems([]);
          setLoading(false);
          return;
        }

        const mainWatchlistId = watchlists[0].id;
        setWatchlistId(mainWatchlistId);

        const tickers = await fetchWatchlistTickers(mainWatchlistId);

        if (!tickers.length) {
          setItems([]);
          setLoading(false);
          return;
        }

        const stockResults = await Promise.all(
          tickers.map(async (ticker: string) => {
            try {
              const stock = await fetchStock(ticker);
              return {
                ticker: stock.ticker,
                price: stock.price,
                changePct: stock.changePct,
              };
            } catch {
              return {
                ticker,
                price: 0,
                changePct: 0,
              };
            }
          })
        );

        setItems(stockResults);
      } catch (error) {
        console.error("Failed to load watchlist:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadWatchlist();
  }, [nav]);

  const handleAddTicker = async (ticker: string) => {
    if (watchlistId == null) {
      alert("No watchlist found.");
      return;
    }

    const normalizedTicker = ticker.trim().toUpperCase();

    if (!normalizedTicker) return;

    try {
      const res = await addToWatchlist(watchlistId, normalizedTicker);

      if (!res.ok) {
        alert(`${normalizedTicker} is already in watchlist`);
        return;
      }

      try {
        const stock = await fetchStock(normalizedTicker);

        setItems((prev) => {
          const alreadyExists = prev.some(
            (item) => item.ticker === stock.ticker
          );

          if (alreadyExists) return prev;

          return [
            ...prev,
            {
              ticker: stock.ticker,
              price: stock.price,
              changePct: stock.changePct,
            },
          ];
        });
      } catch {
        setItems((prev) => {
          const alreadyExists = prev.some(
            (item) => item.ticker === normalizedTicker
          );

          if (alreadyExists) return prev;

          return [
            ...prev,
            {
              ticker: normalizedTicker,
              price: 0,
              changePct: 0,
            },
          ];
        });
      }

      alert(`${normalizedTicker} added to watchlist`);
    } catch (error) {
      console.error("Failed to add ticker:", error);
      alert("Failed to add to watchlist");
    }
  };

  const handleRemove = async (ticker: string) => {
    if (watchlistId == null) return;

    try {
      await removeFromWatchlist(watchlistId, ticker);
      setItems((prev) => prev.filter((x) => x.ticker !== ticker));
    } catch (error) {
      console.error("Failed to remove ticker:", error);
      alert("Failed to remove from watchlist");
    }
  };

  return (
    <div className="container">
      <div className="pageTitle">Watchlist</div>

      <div style={{ marginBottom: 16 }}>
        <StockSearchBar
          onSelectTicker={handleAddTicker}
          buttonLabel="Add"
        />
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)" }}>Loading watchlist...</div>
      ) : (
        <WatchlistTable
          items={items}
          onView={(t) => nav(`/dashboard?t=${encodeURIComponent(t)}`)}
          onRemove={handleRemove}
        />
      )}
    </div>
  );
}