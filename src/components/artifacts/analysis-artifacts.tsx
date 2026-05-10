import { useLayoutEffect, useRef, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import { ExternalLink } from "lucide-react"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type ArtifactScalar = string | number | null

type ArtifactTone = "default" | "positive" | "negative" | "warning"

export type MetricGridArtifact = {
  type: "metric_grid"
  id: string
  title: string
  caption?: string
  items: Array<{
    label: string
    value: string | number
    unit?: string
    tone?: ArtifactTone
  }>
}

export type ChartSeries = {
  key: string
  label: string
}

export type LineChartArtifact = {
  type: "line_chart"
  id: string
  title: string
  caption?: string
  xKey: string
  series: ChartSeries[]
  data: Array<Record<string, ArtifactScalar>>
}

export type AreaChartArtifact = {
  type: "area_chart"
  id: string
  title: string
  caption?: string
  xKey: string
  series: ChartSeries[]
  data: Array<Record<string, ArtifactScalar>>
  stacked?: boolean
}

export type BarChartArtifact = {
  type: "bar_chart"
  id: string
  title: string
  caption?: string
  xKey: string
  series: ChartSeries[]
  data: Array<Record<string, ArtifactScalar>>
}

export type DonutChartArtifact = {
  type: "donut_chart"
  id: string
  title: string
  caption?: string
  segments: Array<{
    label: string
    value: number
  }>
}

export type TableArtifact = {
  type: "table"
  id: string
  title: string
  caption?: string
  columns: Array<{ key: string; label: string }>
  rows: Array<Record<string, ArtifactScalar>>
}

export type TimelineArtifact = {
  type: "event_timeline"
  id: string
  title: string
  caption?: string
  events: Array<{
    date: string
    title: string
    description?: string
    tone?: ArtifactTone
    url?: string
  }>
}

export type CalloutArtifact = {
  type: "callout"
  id: string
  title: string
  body: string
  tone?: ArtifactTone
}

export type AnalysisArtifact =
  | MetricGridArtifact
  | LineChartArtifact
  | AreaChartArtifact
  | BarChartArtifact
  | DonutChartArtifact
  | TableArtifact
  | TimelineArtifact
  | CalloutArtifact

const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
const CHART_MARGIN = { top: 8, right: 8, bottom: 0, left: 8 }
const MIN_Y_AXIS_WIDTH = 42
const FALLBACK_MAX_Y_AXIS_WIDTH = 88

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isArtifactScalar(value: unknown): value is ArtifactScalar {
  return typeof value === "string" || typeof value === "number" || value === null
}

function parseTone(value: unknown): ArtifactTone {
  return value === "positive" || value === "negative" || value === "warning" ? value : "default"
}

function parseRows(rows: unknown): Array<Record<string, ArtifactScalar>> {
  if (!Array.isArray(rows)) return []
  return rows.flatMap((row) => {
    if (!isRecord(row)) return []
    const parsed: Record<string, ArtifactScalar> = {}
    for (const [key, rowValue] of Object.entries(row)) {
      if (isArtifactScalar(rowValue)) parsed[key] = rowValue
    }
    return Object.keys(parsed).length ? [parsed] : []
  })
}

function parseSeries(seriesValue: unknown): ChartSeries[] {
  if (!Array.isArray(seriesValue)) return []
  return seriesValue.flatMap((item) => {
    if (!isRecord(item)) return []
    const key = optionalString(item.key)
    const label = optionalString(item.label) ?? key
    if (!key || !label) return []
    return [{ key, label }]
  })
}

function parseChartArtifact(
  value: Record<string, unknown>,
  type: LineChartArtifact["type"] | AreaChartArtifact["type"] | BarChartArtifact["type"],
  id: string,
  title: string,
): LineChartArtifact | AreaChartArtifact | BarChartArtifact | null {
  const xKey = optionalString(value.xKey)
  const series = parseSeries(value.series)
  const data = parseRows(value.data)
  if (!xKey || series.length === 0 || data.length === 0) return null
  const base = { type, id, title, caption: optionalString(value.caption), xKey, series, data }
  if (type === "area_chart") return { ...base, type, stacked: value.stacked === true }
  return base
}

export function parseArtifact(value: unknown): AnalysisArtifact | null {
  if (!isRecord(value) || typeof value.type !== "string") return null
  const id = optionalString(value.id)
  const title = optionalString(value.title)
  if (!id || !title) return null

  if (value.type === "metric_grid" && Array.isArray(value.items)) {
    const items = value.items.flatMap((item) => {
      if (!isRecord(item)) return []
      const label = optionalString(item.label) ?? optionalString(item.name) ?? optionalString(item.metric)
      if (!label) return []
      if (typeof item.value !== "string" && typeof item.value !== "number") return []
      return [{
        label,
        value: item.value,
        unit: optionalString(item.unit),
        tone: parseTone(item.tone),
      }]
    })
    return items.length ? { type: "metric_grid", id, title, caption: optionalString(value.caption), items } : null
  }

  if (value.type === "line_chart" || value.type === "area_chart" || value.type === "bar_chart") {
    return parseChartArtifact(value, value.type, id, title)
  }

  if (value.type === "donut_chart" && Array.isArray(value.segments)) {
    const segments = value.segments.flatMap((segment) => {
      if (!isRecord(segment)) return []
      const label = optionalString(segment.label) ?? optionalString(segment.name)
      if (!label || typeof segment.value !== "number") return []
      return [{ label, value: segment.value }]
    })
    return segments.length ? { type: "donut_chart", id, title, caption: optionalString(value.caption), segments } : null
  }

  if (value.type === "table" && Array.isArray(value.columns) && Array.isArray(value.rows)) {
    const columns = value.columns.flatMap((item) => {
      if (!isRecord(item)) return []
      const key = optionalString(item.key)
      const label = optionalString(item.label) ?? key
      if (!key || !label) return []
      return [{ key, label }]
    })
    return columns.length ? { type: "table", id, title, caption: optionalString(value.caption), columns, rows: parseRows(value.rows) } : null
  }

  if (value.type === "event_timeline" && Array.isArray(value.events)) {
    const events = value.events.flatMap((event) => {
      if (!isRecord(event)) return []
      const date = optionalString(event.date)
      const eventTitle = optionalString(event.title)
      if (!date || !eventTitle) return []
      return [{
        date,
        title: eventTitle,
        description: optionalString(event.description),
        tone: parseTone(event.tone),
        url: optionalString(event.url),
      }]
    })
    return events.length ? { type: "event_timeline", id, title, caption: optionalString(value.caption), events } : null
  }

  if (value.type === "callout") {
    const body = optionalString(value.body) ?? optionalString(value.description)
    return body ? { type: "callout", id, title, body, tone: parseTone(value.tone) } : null
  }

  return null
}

function ArtifactShell({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) {
  return (
    <section className="border-border bg-muted/20 w-full rounded-2xl border p-4">
      <div className="mb-2">
        <h4 className="text-foreground text-xs font-medium">{title}</h4>
        {caption ? <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">{caption}</p> : null}
      </div>
      {children}
    </section>
  )
}

function artifactToneClass(tone: ArtifactTone | undefined) {
  if (tone === "positive") return "text-green-600 dark:text-green-400"
  if (tone === "negative") return "text-red-600 dark:text-red-400"
  if (tone === "warning") return "text-amber-600 dark:text-amber-400"
  return "text-foreground"
}

function calloutClass(tone: ArtifactTone | undefined) {
  if (tone === "positive") return "border-green-500/25 bg-green-500/10"
  if (tone === "negative") return "border-red-500/25 bg-red-500/10"
  if (tone === "warning") return "border-amber-500/25 bg-amber-500/10"
  return "border-border bg-muted/20"
}

function formatTick(value: unknown): string {
  if (typeof value === "number") {
    const abs = Math.abs(value)
    const options: Intl.NumberFormatOptions =
      abs >= 1_000
        ? { notation: "compact", maximumFractionDigits: 1 }
        : { maximumFractionDigits: abs < 10 ? 2 : 1 }
    return new Intl.NumberFormat("en", options).format(value)
  }
  if (typeof value !== "string") return ""
  const dateMatch = /^\d{4}-\d{2}-\d{2}$/.test(value)
  if (!dateMatch) return value.length > 12 ? `${value.slice(0, 12)}…` : value
  const date = new Date(`${value}T00:00:00Z`)
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    setWidth(element.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, width] as const
}

function yAxisWidth(data: Array<Record<string, ArtifactScalar>>, series: ChartSeries[], containerWidth: number): number {
  const values = data.flatMap((row) =>
    series.flatMap((item) => {
      const value = row[item.key]
      return typeof value === "number" ? [formatTick(value)] : []
    })
  )
  const longest = values.reduce((max, value) => Math.max(max, value.length), 0)
  const dynamicMax = containerWidth > 0 ? clamp(containerWidth * 0.22, 56, 104) : FALLBACK_MAX_Y_AXIS_WIDTH
  return clamp(longest * 7 + 18, MIN_Y_AXIS_WIDTH, dynamicMax)
}

function yAxisTick(axisWidth: number) {
  return { textAnchor: "start" as const, dx: -(axisWidth - 8) }
}

function barXAxisInterval(dataLength: number): 0 | "preserveStartEnd" {
  return dataLength <= 8 ? 0 : "preserveStartEnd"
}

function chartConfig(series: ChartSeries[]): ChartConfig {
  return Object.fromEntries(
    series.map((item, index) => [item.key, { label: item.label, color: chartColors[index % chartColors.length] }])
  ) satisfies ChartConfig
}

function MetricGridArtifactView({ artifact }: { artifact: MetricGridArtifact }) {
  return (
    <ArtifactShell title={artifact.title} caption={artifact.caption}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        {artifact.items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="min-w-0">
            <div className="text-muted-foreground truncate text-[11px]">{item.label}</div>
            <div className={cn("mt-1 truncate text-sm font-semibold", artifactToneClass(item.tone))}>
              {item.value}{item.unit ? <span className="text-muted-foreground ml-1 text-xs font-normal">{item.unit}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </ArtifactShell>
  )
}

function LineChartArtifactView({ artifact }: { artifact: LineChartArtifact }) {
  const config = chartConfig(artifact.series)
  const [chartRef, chartWidth] = useElementWidth<HTMLDivElement>()
  const axisWidth = yAxisWidth(artifact.data, artifact.series, chartWidth)
  return (
    <ArtifactShell title={artifact.title} caption={artifact.caption}>
      <div ref={chartRef}>
        <ChartContainer config={config} className="aspect-auto h-56 w-full" initialDimension={{ width: 640, height: 224 }}>
          <LineChart data={artifact.data} margin={CHART_MARGIN}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={artifact.xKey}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={28}
              tickMargin={8}
              tickFormatter={formatTick}
            />
            <YAxis axisLine={false} tickLine={false} width={axisWidth} tick={yAxisTick(axisWidth)} tickMargin={8} tickFormatter={formatTick} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            {artifact.series.map((series, index) => (
              <Line
                key={series.key}
                dataKey={series.key}
                type="monotone"
                stroke={chartColors[index % chartColors.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ChartContainer>
      </div>
    </ArtifactShell>
  )
}

function AreaChartArtifactView({ artifact }: { artifact: AreaChartArtifact }) {
  const config = chartConfig(artifact.series)
  const [chartRef, chartWidth] = useElementWidth<HTMLDivElement>()
  const axisWidth = yAxisWidth(artifact.data, artifact.series, chartWidth)
  return (
    <ArtifactShell title={artifact.title} caption={artifact.caption}>
      <div ref={chartRef}>
        <ChartContainer config={config} className="aspect-auto h-56 w-full" initialDimension={{ width: 640, height: 224 }}>
          <AreaChart data={artifact.data} margin={CHART_MARGIN}>
            <defs>
              {artifact.series.map((series, index) => (
                <linearGradient key={series.key} id={`fill-${artifact.id}-${series.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors[index % chartColors.length]} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={chartColors[index % chartColors.length]} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={artifact.xKey}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={28}
              tickMargin={8}
              tickFormatter={formatTick}
            />
            <YAxis axisLine={false} tickLine={false} width={axisWidth} tick={yAxisTick(axisWidth)} tickMargin={8} tickFormatter={formatTick} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            {artifact.series.map((series, index) => (
              <Area
                key={series.key}
                dataKey={series.key}
                type="monotone"
                stackId={artifact.stacked ? "stack" : undefined}
                stroke={chartColors[index % chartColors.length]}
                fill={`url(#fill-${artifact.id}-${series.key})`}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </div>
    </ArtifactShell>
  )
}

function BarChartArtifactView({ artifact }: { artifact: BarChartArtifact }) {
  const config = chartConfig(artifact.series)
  const [chartRef, chartWidth] = useElementWidth<HTMLDivElement>()
  const axisWidth = yAxisWidth(artifact.data, artifact.series, chartWidth)
  return (
    <ArtifactShell title={artifact.title} caption={artifact.caption}>
      <div ref={chartRef}>
        <ChartContainer config={config} className="aspect-auto h-56 w-full" initialDimension={{ width: 640, height: 224 }}>
          <BarChart data={artifact.data} margin={CHART_MARGIN}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={artifact.xKey}
              axisLine={false}
              tickLine={false}
              interval={barXAxisInterval(artifact.data.length)}
              minTickGap={20}
              tickMargin={8}
              tickFormatter={formatTick}
            />
            <YAxis axisLine={false} tickLine={false} width={axisWidth} tick={yAxisTick(axisWidth)} tickMargin={8} tickFormatter={formatTick} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            {artifact.series.map((series, index) => (
              <Bar key={series.key} dataKey={series.key} fill={chartColors[index % chartColors.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ChartContainer>
      </div>
    </ArtifactShell>
  )
}

function DonutChartArtifactView({ artifact }: { artifact: DonutChartArtifact }) {
  const total = artifact.segments.reduce((sum, segment) => sum + segment.value, 0)
  const config = Object.fromEntries(
    artifact.segments.map((segment, index) => [segment.label, { label: segment.label, color: chartColors[index % chartColors.length] }])
  ) satisfies ChartConfig
  return (
    <ArtifactShell title={artifact.title} caption={artifact.caption}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center">
        <div className="space-y-2">
          {artifact.segments.map((segment, index) => (
            <div key={segment.label} className="flex items-center gap-2 text-xs">
              <span className="size-2 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
              <span className="text-muted-foreground min-w-0 flex-1 truncate">{segment.label}</span>
              <span className="text-foreground font-medium">{total ? `${Math.round((segment.value / total) * 100)}%` : segment.value}</span>
            </div>
          ))}
        </div>
        <ChartContainer config={config} className="mx-auto aspect-square h-44" initialDimension={{ width: 176, height: 176 }}>
          <PieChart>
            <Pie data={artifact.segments} dataKey="value" nameKey="label" innerRadius={48} outerRadius={76} strokeWidth={0}>
              {artifact.segments.map((segment, index) => (
                <Cell key={segment.label} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          </PieChart>
        </ChartContainer>
      </div>
    </ArtifactShell>
  )
}

function TableArtifactView({ artifact }: { artifact: TableArtifact }) {
  return (
    <ArtifactShell title={artifact.title} caption={artifact.caption}>
      <ScrollArea className="w-full">
        <table className="min-w-full caption-bottom text-xs">
          <TableHeader>
            <TableRow>
              {artifact.columns.map((column, columnIndex) => (
                <TableHead
                  key={column.key}
                  className={cn(columnIndex === 0 && "pl-0", columnIndex === artifact.columns.length - 1 && "pr-0")}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {artifact.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={artifact.columns.length} className="text-muted-foreground h-16 px-0 text-center">No rows to display.</TableCell>
              </TableRow>
            ) : artifact.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {artifact.columns.map((column, columnIndex) => (
                  <TableCell
                    key={column.key}
                    className={cn(columnIndex === 0 && "pl-0", columnIndex === artifact.columns.length - 1 && "pr-0")}
                  >
                    {row[column.key] ?? ""}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </ArtifactShell>
  )
}

function TimelineArtifactView({ artifact }: { artifact: TimelineArtifact }) {
  return (
    <ArtifactShell title={artifact.title} caption={artifact.caption}>
      <div className="space-y-3">
        {artifact.events.map((event, index) => (
          <div key={`${event.date}-${event.title}-${index}`} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 text-xs">
            <div className="text-muted-foreground pt-0.5">{event.date}</div>
            <div className="border-border relative border-l pl-3">
              <span className={cn("bg-background border-border absolute -left-1.5 top-1 size-3 rounded-full border", event.tone === "positive" && "border-green-500", event.tone === "negative" && "border-red-500", event.tone === "warning" && "border-amber-500")} />
              <div className="text-foreground font-medium">
                {event.url ? (
                  <a href={event.url} target="_blank" rel="noreferrer" className="hover:underline">
                    {event.title}
                    <ExternalLink className="ml-1 inline size-3" />
                  </a>
                ) : event.title}
              </div>
              {event.description ? <div className="text-muted-foreground mt-0.5 leading-relaxed">{event.description}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </ArtifactShell>
  )
}

function CalloutArtifactView({ artifact }: { artifact: CalloutArtifact }) {
  return (
    <section className={cn("w-full rounded-2xl border p-4", calloutClass(artifact.tone))}>
      <h4 className="text-foreground text-xs font-medium">{artifact.title}</h4>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{artifact.body}</p>
    </section>
  )
}

export function ArtifactView({ artifact }: { artifact: AnalysisArtifact }) {
  if (artifact.type === "metric_grid") return <MetricGridArtifactView artifact={artifact} />
  if (artifact.type === "line_chart") return <LineChartArtifactView artifact={artifact} />
  if (artifact.type === "area_chart") return <AreaChartArtifactView artifact={artifact} />
  if (artifact.type === "bar_chart") return <BarChartArtifactView artifact={artifact} />
  if (artifact.type === "donut_chart") return <DonutChartArtifactView artifact={artifact} />
  if (artifact.type === "event_timeline") return <TimelineArtifactView artifact={artifact} />
  if (artifact.type === "callout") return <CalloutArtifactView artifact={artifact} />
  return <TableArtifactView artifact={artifact} />
}

export function ArtifactBlock({ artifacts }: { artifacts: AnalysisArtifact[] }) {
  if (artifacts.length === 0) return null
  return (
    <div className="grid w-full gap-3">
      {artifacts.map((artifact) => <ArtifactView key={`${artifact.type}-${artifact.id}`} artifact={artifact} />)}
    </div>
  )
}
