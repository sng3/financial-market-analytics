import React, { useMemo, useState } from "react";
import Card from "./Card";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export const ranges = ["1D", "5D", "1M", "6M", "1Y", "MAX"] as const;
export type HistoryRange = (typeof ranges)[number];

type Props = {
  series: { t: string; v: number }[];
  selectedRange: HistoryRange;
  onRangeChange: (range: HistoryRange) => void;
};

function calculateSMA(data: number[], period: number): (number | null)[] {
  return data.map((_, index) => {
    if (index < period - 1) return null;
    const window = data.slice(index - period + 1, index + 1);
    const sum = window.reduce((acc, value) => acc + value, 0);
    return sum / period;
  });
}

function calculateRSI(data: number[], period: number = 14): (number | null)[] {
  if (data.length < period + 1) {
    return data.map(() => null);
  }

  const rsi: (number | null)[] = Array(data.length).fill(null);

  for (let i = period; i < data.length; i++) {
    let gains = 0;
    let losses = 0;

    for (let j = i - period + 1; j <= i; j++) {
      const change = data[j] - data[j - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - 100 / (1 + rs);
    }
  }

  return rsi;
}

export default function HistoricalChartCard({
  series,
  selectedRange,
  onRangeChange,
}: Props) {
  const [showSMA, setShowSMA] = useState(true);
  const [showRSI, setShowRSI] = useState(false);

  const labels = useMemo(() => series.map((point) => point.t), [series]);
  const prices = useMemo(() => series.map((point) => point.v), [series]);
  const smaData = useMemo(() => calculateSMA(prices, 14), [prices]);
  const rsiData = useMemo(() => calculateRSI(prices, 14), [prices]);

  const chartData = useMemo(() => {
    const datasets: any[] = [
      {
        label: "Price",
        data: prices,
        borderColor: "#4A90E2",
        backgroundColor: "rgba(74, 144, 226, 0.15)",
        tension: 0.25,
        pointRadius: 0,
        borderWidth: 2,
        yAxisID: "y",
      },
    ];

    if (showSMA) {
      datasets.push({
        label: "SMA (14)",
        data: smaData,
        borderColor: "#F5A623",
        backgroundColor: "rgba(245, 166, 35, 0.12)",
        tension: 0.25,
        pointRadius: 0,
        borderWidth: 2,
        yAxisID: "y",
      });
    }

    if (showRSI) {
      datasets.push({
        label: "RSI (14)",
        data: rsiData,
        borderColor: "#7ED321",
        backgroundColor: "rgba(126, 211, 33, 0.12)",
        tension: 0.25,
        pointRadius: 0,
        borderWidth: 2,
        yAxisID: "y1",
      });
    }

    return {
      labels,
      datasets,
    };
  }, [labels, prices, smaData, rsiData, showSMA, showRSI]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index" as const,
        intersect: false,
      },
      plugins: {
        legend: {
          labels: {
            color: "#d6d9df",
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#9aa4b2",
            maxTicksLimit: 8,
          },
          grid: {
            color: "rgba(255,255,255,0.06)",
          },
        },
        y: {
          position: "left" as const,
          ticks: {
            color: "#9aa4b2",
          },
          grid: {
            color: "rgba(255,255,255,0.06)",
          },
        },
        y1: {
          display: showRSI,
          position: "right" as const,
          min: 0,
          max: 100,
          ticks: {
            color: "#9aa4b2",
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    };
  }, [showRSI]);

  return (
    <Card
      title="Historical Price Chart"
      right={
        <div className="rowWrap">
          {ranges.map((range) => (
            <button
              key={range}
              className="btn"
              style={{
                padding: "6px 10px",
                borderColor:
                  range === selectedRange
                    ? "rgba(74,144,226,0.6)"
                    : "var(--border)",
                background:
                  range === selectedRange
                    ? "rgba(74,144,226,0.12)"
                    : "rgba(255,255,255,0.02)",
              }}
              onClick={() => onRangeChange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      }
    >
      <div
        style={{
          height: 340,
          border: "1px dashed rgba(255,255,255,0.12)",
          borderRadius: 14,
          padding: 12,
        }}
      >
        {series.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div
            style={{
              height: "100%",
              display: "grid",
              placeItems: "center",
              color: "var(--muted)",
            }}
          >
            No historical data available
          </div>
        )}
      </div>

      <div className="rowWrap" style={{ marginTop: 12 }}>
        <label className="row" style={{ color: "var(--muted)" }}>
          <input
            type="checkbox"
            checked={showSMA}
            onChange={(e) => setShowSMA(e.target.checked)}
          />
          SMA
        </label>
        <label className="row" style={{ color: "var(--muted)" }}>
          <input
            type="checkbox"
            checked={showRSI}
            onChange={(e) => setShowRSI(e.target.checked)}
          />
          RSI
        </label>
      </div>
    </Card>
  );
}