import Panel from "../ui/Panel";

type Props = { symbol: string };

export default function TechnicalPanel({ symbol }: Props) {
  return (
    <Panel title="Technical Indicators">
      <p style={{ color: "#bdbdbd", margin: 0 }}>
        Placeholder for SMA, EMA, RSI, MACD for {symbol}.
      </p>
    </Panel>
  );
}
