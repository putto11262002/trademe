import { format } from "date-fns"
import type { Trade } from "@/trade"
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
import { dash, qty, usd2 } from "./format"

export function TradeHistoryCard({ trades }: { trades: Array<Trade> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade history</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {trades.length === 0 ? (
          <p className="text-muted-foreground px-6 text-sm">
            No trades recorded for this ticker.
          </p>
        ) : (
          <div className="overflow-x-auto px-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Fees</TableHead>
                  <TableHead className="text-right">FX</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(t.tradedAt, "yyyy-MM-dd")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={t.side === "buy" ? "default" : "secondary"}
                        className={
                          t.side === "buy"
                            ? "bg-green-600 text-white hover:bg-green-600/90"
                            : ""
                        }
                      >
                        {t.side}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {qty.format(t.quantity)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {usd2.format(t.pricePerShare)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right tabular-nums">
                      {usd2.format(t.fees)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right tabular-nums">
                      {t.fxRate != null ? t.fxRate.toFixed(2) : dash}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
