import Panel from "../ui/Panel";

type Props = { symbol: string };

export default function ChartPanel({ symbol }: Props) {
  return (
    <Panel title="Historical Chart">
      <p style={{ color: "#bdbdbd", margin: 0 }}>
        Placeholder chart for {symbol}. Add a chart library in Week 2.
      </p>
    </Panel>
  );
}
