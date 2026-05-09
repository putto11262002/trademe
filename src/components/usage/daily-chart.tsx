"use client"

import { useState } from "react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DailyUsageRow } from "@/agent/usage/api.server"

const chartConfig = { costUsd: { label: "Cost (USD)" } }

function modelLabel(modelId: string) {
  if (modelId.includes("flash")) return "Flash"
  if (modelId.includes("pro")) return "Pro"
  return modelId
}

function generateDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.now() - (n - 1 - i) * 24 * 60 * 60 * 1000)
    return d.toISOString().slice(0, 10)
  })
}

export function DailyChart({ data }: { data: DailyUsageRow[] }) {
  const models = Array.from(new Set(data.map((r) => r.model)))
  const [selected, setSelected] = useState<string>("all")

  const days = generateDays(30)

  const filtered = selected === "all" ? data : data.filter((r) => r.model === selected)

  const byDay = new Map<string, number>()
  for (const r of filtered) {
    byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.costUsd)
  }

  const chartData = days.map((day) => ({
    day: day.slice(5), // MM-DD
    fullDay: day,
    costUsd: byDay.get(day) ?? 0,
  }))

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">Daily spend — last 30 days</CardTitle>
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
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `$${Number(v).toFixed(3)}`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    Number(value) === 0 ? null : [`$${Number(value).toFixed(4)}`, "Cost"]
                  }
                />
              }
            />
            <Bar dataKey="costUsd" fill="var(--primary)" radius={[2, 2, 0, 0]} minPointSize={0} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
