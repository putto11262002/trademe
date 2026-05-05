import { useMemo, useState } from "react"
import type { EnrichedPosition } from "@/trade"
import { ItemGroup } from "@/components/ui/item"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PositionCard } from "./position-card"

const SORT_OPTIONS = {
  "value-desc": { label: "Value (high → low)", fn: (a: EnrichedPosition, b: EnrichedPosition) => b.valueTHB - a.valueTHB },
  "value-asc": { label: "Value (low → high)", fn: (a: EnrichedPosition, b: EnrichedPosition) => a.valueTHB - b.valueTHB },
  "ticker-asc": { label: "Ticker (A → Z)", fn: (a: EnrichedPosition, b: EnrichedPosition) => a.ticker.localeCompare(b.ticker) },
  "ticker-desc": { label: "Ticker (Z → A)", fn: (a: EnrichedPosition, b: EnrichedPosition) => b.ticker.localeCompare(a.ticker) },
  "pnl-desc": { label: "P&L (best first)", fn: (a: EnrichedPosition, b: EnrichedPosition) => b.unrealizedPnLPct - a.unrealizedPnLPct },
  "pnl-asc": { label: "P&L (worst first)", fn: (a: EnrichedPosition, b: EnrichedPosition) => a.unrealizedPnLPct - b.unrealizedPnLPct },
} as const

type SortKey = keyof typeof SORT_OPTIONS

export function HoldingsList({
  positions,
}: {
  positions: Array<EnrichedPosition>
}) {
  const [sort, setSort] = useState<SortKey>("value-desc")
  const sorted = useMemo(
    () => [...positions].sort(SORT_OPTIONS[sort].fn),
    [positions, sort],
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Holdings</h2>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORT_OPTIONS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ItemGroup>
        {sorted.map((p) => (
          <PositionCard key={p.ticker} position={p} />
        ))}
      </ItemGroup>
    </div>
  )
}
