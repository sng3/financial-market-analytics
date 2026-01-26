import Panel from "../ui/Panel";
import type { StockOverview } from "../../services/api";

type Props = { overview: StockOverview };

export default function PricePanel({ overview }: Props) {
  const sign = overview.change >= 0 ? "+" : "";
  return (
    <Panel title="Price">
      <p style={{ fontSize: 28, margin: "6px 0 10px" }}>
        ${overview.price.toFixed(2)}
      </p>
      <p style={{ margin: 0, color: overview.change >= 0 ? "#7CFC98" : "#FF6B6B" }}>
        {sign}{overview.change.toFixed(2)} ({sign}{overview.changePercent.toFixed(2)}%)
      </p>
      <p style={{ marginTop: 10, color: "#bdbdbd" }}>
        Symbol: <b>{overview.symbol}</b>
      </p>
    </Panel>
  );
}
