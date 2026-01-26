import Panel from "../ui/Panel";

type Props = { symbol: string };

export default function PredictionPanel({ symbol }: Props) {
  return (
    <Panel title="AI/ML Prediction">
      <p style={{ color: "#bdbdbd", margin: 0 }}>
        Placeholder for prediction model and confidence score for {symbol}.
      </p>
    </Panel>
  );
}
