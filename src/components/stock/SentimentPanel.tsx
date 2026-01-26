import Panel from "../ui/Panel";

type Props = { symbol: string };

export default function SentimentPanel({ symbol }: Props) {
  return (
    <Panel title="Sentiment Analysis">
      <p style={{ color: "#bdbdbd", margin: 0 }}>
        Placeholder for sentiment score + news headlines for {symbol}.
      </p>
    </Panel>
  );
}
