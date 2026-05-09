"use client"

import { useState } from "react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DailyUsageRow } from "@/agent/usage/api.server"

const chartConfig = {
  inputTokens: { label: "Input", color: "var(--chart-1)" },
  outputTokens: { label: "Output", color: "var(--chart-2)" },
}

function modelLabel(modelId: string) {
  if (modelId.includes("flash")) return "Flash"
  if (modelId.includes("pro")) return "Pro"
  return modelId
}

function fmtTokens(n: number) {
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}k`
      : String(n)
}

function generateDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.now() - (n - 1 - i) * 24 * 60 * 60 * 1000)
    return d.toISOString().slice(0, 10)
  })
}

export function TokenChart({ data }: { data: DailyUsageRow[] }) {
  const models = Array.from(new Set(data.map((r) => r.model)))
  const [selected, setSelected] = useState<string>("all")

  const days = generateDays(7)
  const filtered = selected === "all" ? data : data.filter((r) => r.model === selected)

  const byDay = new Map<string, { inputTokens: number; outputTokens: number }>()
  for (const r of filtered) {
    const prev = byDay.get(r.day) ?? { inputTokens: 0, outputTokens: 0 }
    byDay.set(r.day, {
      inputTokens: prev.inputTokens + r.inputTokens,
      outputTokens: prev.outputTokens + r.outputTokens,
    })
  }

  const chartData = days.map((day) => ({
    day: day.slice(5),
    inputTokens: byDay.get(day)?.inputTokens ?? 0,
    outputTokens: byDay.get(day)?.outputTokens ?? 0,
  }))

  const totalInput = filtered.reduce((acc, r) => acc + r.inputTokens, 0)
  const totalOutput = filtered.reduce((acc, r) => acc + r.outputTokens, 0)
  const total = totalInput + totalOutput

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Token usage</CardTitle>
            <p className="text-2xl font-semibold">{fmtTokens(total)}</p>
            <p className="text-xs text-muted-foreground">
              {fmtTokens(totalInput)} input · {fmtTokens(totalOutput)} output
            </p>
          </div>
          {models.length > 1 && (
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="h-7 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All models</SelectItem>
                {models.map((m) => (
                  <SelectItem key={m} value={m}>{modelLabel(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Last 7 days</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={fmtTokens}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(v, name) => [
                    fmtTokens(Number(v)),
                    name === "inputTokens" ? "Input" : "Output",
                  ]}
                />
              }
            />
            <Bar dataKey="inputTokens" stackId="tokens" fill="var(--color-inputTokens)" radius={[0, 0, 0, 0]} minPointSize={0} />
            <Bar dataKey="outputTokens" stackId="tokens" fill="var(--color-outputTokens)" radius={[2, 2, 0, 0]} minPointSize={0} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
