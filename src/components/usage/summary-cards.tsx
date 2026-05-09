import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { UsageSummary } from "@/agent/usage/api.server"

export function QuotaCard({ summary }: { summary: UsageSummary }) {
  const pct = Math.min(100, (summary.totalCostUsd / summary.monthlyLimitUsd) * 100)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Monthly usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-end justify-between">
          <span className="text-2xl font-semibold">${summary.totalCostUsd.toFixed(4)}</span>
          <span className="text-sm text-muted-foreground">of ${summary.monthlyLimitUsd.toFixed(2)}</span>
        </div>
        <Progress value={pct} className="h-2" />
        <p className="text-xs text-muted-foreground">{pct.toFixed(1)}% used</p>
      </CardContent>
    </Card>
  )
}
