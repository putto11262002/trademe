import { format, formatDistanceToNow } from "date-fns"
import { CalendarDays } from "lucide-react"
import type { EarningsEvent } from "@/market"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { dash } from "./format"

function beat(actual?: number, est?: number) {
  if (actual == null || est == null) return null
  if (actual > est) return { label: "Beat", variant: "default" as const, className: "bg-green-600 text-white hover:bg-green-600/90" }
  if (actual < est) return { label: "Miss", variant: "destructive" as const, className: "" }
  return { label: "In line", variant: "secondary" as const, className: "" }
}

export function EarningsCard({
  next,
  past,
}: {
  next: EarningsEvent | null
  past: Array<EarningsEvent>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <div className="px-6">
          <div className="text-muted-foreground text-xs">Next earnings</div>
          {next ? (
            <div className="flex items-center gap-2">
              <CalendarDays className="text-muted-foreground size-4" />
              <span className="text-base font-medium">
                {format(next.date, "MMM d, yyyy")}
              </span>
              <span className="text-muted-foreground text-xs">
                ({formatDistanceToNow(next.date, { addSuffix: true })})
              </span>
              {next.estimatedEPS != null ? (
                <span className="text-muted-foreground text-xs tabular-nums">
                  · est EPS {next.estimatedEPS.toFixed(2)}
                </span>
              ) : null}
            </div>
          ) : (
            <p className="text-sm">No upcoming earnings scheduled. {dash}</p>
          )}
        </div>
        <div>
          <div className="text-muted-foreground mb-1 px-6 text-xs">
            Past results
          </div>
          {past.length === 0 ? (
            <p className="text-muted-foreground px-6 text-sm">
              No past earnings recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto px-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Estimate</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {past.map((e) => {
                    const verdict = beat(e.actualEPS, e.estimatedEPS)
                    return (
                      <TableRow key={e.date.toISOString()}>
                        <TableCell className="whitespace-nowrap">
                          {format(e.date, "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {e.estimatedEPS != null ? e.estimatedEPS.toFixed(2) : dash}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {e.actualEPS != null ? e.actualEPS.toFixed(2) : dash}
                        </TableCell>
                        <TableCell>
                          {verdict ? (
                            <Badge
                              variant={verdict.variant}
                              className={verdict.className}
                            >
                              {verdict.label}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">{dash}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
