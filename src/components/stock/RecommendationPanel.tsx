import Panel from "../ui/Panel";

type Props = { symbol: string };

export default function RecommendationPanel({ symbol }: Props) {
  return (
    <Panel title="Recommendation">
      <p style={{ color: "#bdbdbd", margin: 0 }}>
        Placeholder for risk-based recommendation (Buy/Hold/Watch) for {symbol}.
      </p>
    </Panel>
  );
}
