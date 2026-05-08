import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { UsageSummary } from "@/agent/usage/api.server"

function fmt(n: number, decimals = 4) {
  return n.toFixed(decimals)
}

function fmtTokens(n: number) {
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}k`
      : String(n)
}

function modelLabel(modelId: string) {
  if (modelId.includes("flash")) return "Flash"
  if (modelId.includes("pro")) return "Pro"
  return modelId
}

export function SummaryCards({ summary }: { summary: UsageSummary }) {
  const pct = Math.min(100, (summary.totalCostUsd / summary.monthlyLimitUsd) * 100)

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {/* Quota */}
      <Card className="col-span-2 lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Monthly quota</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-end justify-between">
            <span className="text-2xl font-semibold">${fmt(summary.totalCostUsd)}</span>
            <span className="text-sm text-muted-foreground">of ${summary.monthlyLimitUsd.toFixed(2)}</span>
          </div>
          <Progress value={pct} className="h-2" />
          <p className="text-xs text-muted-foreground">{pct.toFixed(1)}% used</p>
        </CardContent>
      </Card>

      {/* Runs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Runs this month</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-2xl font-semibold">{summary.totalRuns}</span>
        </CardContent>
      </Card>

      {/* Tokens */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tokens this month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <span className="text-2xl font-semibold">{fmtTokens(summary.totalInputTokens + summary.totalOutputTokens)}</span>
          <p className="text-xs text-muted-foreground">
            {fmtTokens(summary.totalInputTokens)} in · {fmtTokens(summary.totalOutputTokens)} out
          </p>
        </CardContent>
      </Card>

      {/* By model */}
      {summary.byModel.length > 0 && (
        <Card className="col-span-2 lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">By model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {summary.byModel.map((m) => (
                <div key={m.model} className="space-y-0.5">
                  <p className="text-sm font-medium">{modelLabel(m.model)}</p>
                  <p className="text-xs text-muted-foreground">${fmt(m.costUsd)} · {m.runs} runs</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
