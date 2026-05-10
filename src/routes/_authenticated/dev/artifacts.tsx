import { createFileRoute } from "@tanstack/react-router"
import { ArtifactView, type AnalysisArtifact } from "@/components/artifacts/analysis-artifacts"

export const Route = createFileRoute("/_authenticated/dev/artifacts")({
  component: ArtifactDemoPage,
})

const sampleArtifacts: AnalysisArtifact[] = [
  {
    type: "metric_grid",
    id: "momentum_metrics",
    title: "Momentum snapshot",
    caption: "Compact KPI values with optional tone hints.",
    items: [
      { label: "1M return", value: "+8.4", unit: "%", tone: "positive" },
      { label: "RSI 14", value: 63.2 },
      { label: "Max drawdown", value: "-12.7", unit: "%", tone: "negative" },
      { label: "Volatility", value: "34.1", unit: "%" },
      { label: "Distance from 52w high", value: "-6.5", unit: "%", tone: "warning" },
      { label: "Beta", value: 1.42 },
    ],
  },
  {
    type: "line_chart",
    id: "price_trend",
    title: "Price vs moving average",
    caption: "Time-series comparison with one or more numeric series.",
    xKey: "date",
    series: [
      { key: "close", label: "Close" },
      { key: "sma20", label: "SMA 20" },
    ],
    data: [
      { date: "2026-01-02", close: 188, sma20: 181 },
      { date: "2026-02-02", close: 202, sma20: 190 },
      { date: "2026-03-02", close: 196, sma20: 199 },
      { date: "2026-04-02", close: 218, sma20: 205 },
      { date: "2026-05-02", close: 224, sma20: 216 },
    ],
  },
  {
    type: "area_chart",
    id: "allocation_drift",
    title: "Allocation drift",
    caption: "Filled chart for exposure, cumulative contribution, or drawdown bands.",
    xKey: "month",
    stacked: true,
    series: [
      { key: "megaCap", label: "Mega cap" },
      { key: "growth", label: "Growth" },
      { key: "cash", label: "Cash" },
    ],
    data: [
      { month: "Jan", megaCap: 42, growth: 32, cash: 26 },
      { month: "Feb", megaCap: 45, growth: 34, cash: 21 },
      { month: "Mar", megaCap: 48, growth: 31, cash: 21 },
      { month: "Apr", megaCap: 51, growth: 33, cash: 16 },
      { month: "May", megaCap: 55, growth: 30, cash: 15 },
    ],
  },
  {
    type: "bar_chart",
    id: "return_by_ticker",
    title: "Return by ticker",
    caption: "Category comparison for rankings, exposure, or period returns.",
    xKey: "ticker",
    series: [{ key: "returnPct", label: "Return %" }],
    data: [
      { ticker: "NVDA", returnPct: 18.4 },
      { ticker: "MSFT", returnPct: 7.2 },
      { ticker: "AAPL", returnPct: -4.1 },
      { ticker: "GOOGL", returnPct: 11.8 },
      { ticker: "AMZN", returnPct: 5.6 },
    ],
  },
  {
    type: "donut_chart",
    id: "sector_mix",
    title: "Sector mix",
    caption: "Composition snapshot using simple label/value segments.",
    segments: [
      { label: "Semiconductors", value: 38 },
      { label: "Software", value: 24 },
      { label: "Consumer", value: 18 },
      { label: "Cash", value: 12 },
      { label: "Other", value: 8 },
    ],
  },
  {
    type: "table",
    id: "latest_candles",
    title: "Latest candles",
    caption: "Small comparison table. Keep rows compact in chat.",
    columns: [
      { key: "date", label: "Date" },
      { key: "close", label: "Close" },
      { key: "volume", label: "Volume" },
      { key: "note", label: "Note" },
    ],
    rows: [
      { date: "2026-05-04", close: 219.12, volume: "42.1M", note: "Above SMA 20" },
      { date: "2026-05-05", close: 222.34, volume: "38.7M", note: "Higher low" },
      { date: "2026-05-06", close: 224.08, volume: "44.6M", note: "Volume pickup" },
    ],
  },
  {
    type: "event_timeline",
    id: "catalyst_timeline",
    title: "Catalyst timeline",
    caption: "Dated events, earnings, news catalysts, or trade history.",
    events: [
      { date: "2026-02-21", title: "Earnings beat", description: "Revenue and margin came in ahead of consensus.", tone: "positive" },
      { date: "2026-03-13", title: "Sector pullback", description: "Semiconductor basket sold off with broader risk assets.", tone: "negative" },
      { date: "2026-04-24", title: "Guidance update", description: "Management commentary improved near-term demand visibility.", tone: "positive" },
    ],
  },
  {
    type: "callout",
    id: "data_gap",
    title: "Data gap",
    body: "Revenue is missing in the current fundamentals response, so valuation checks should avoid price-to-sales until the data source is improved.",
    tone: "warning",
  },
]

function ArtifactDemoPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Artifact Demo</h1>
        <p className="text-muted-foreground text-sm">
          Primitive UI payloads rendered by the same components used in chat.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        {sampleArtifacts.map((artifact) => (
          <ArtifactView key={`${artifact.type}-${artifact.id}`} artifact={artifact} />
        ))}
      </div>
    </div>
  )
}
