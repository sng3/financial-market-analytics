import React from "react";
import Card from "./Card";

type Props = {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  updatedAt: string;
  marketStatus: "Open" | "Closed";
};

export default function PriceOverviewCard(props: Props) {
  const up = props.change >= 0;
  const color = up ? "var(--green)" : "var(--red)";
  const sign = up ? "+" : "";

  return (
    <Card
      title={`${props.ticker}  ${props.name}`}
      right={<span className="badge">Updated {props.updatedAt}</span>}
    >
      <div className="rowWrap" style={{ justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 34, fontWeight: 900 }}>${props.price.toFixed(2)}</div>
          <div style={{ color, fontWeight: 700 }}>
            {sign}{props.change.toFixed(2)} ({sign}{props.changePct.toFixed(2)}%)
          </div>
        </div>
        <span className="badge">Market {props.marketStatus}</span>
      </div>
    </Card>
  );
}