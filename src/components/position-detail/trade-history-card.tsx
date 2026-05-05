import { useState } from "react"
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpDown } from "lucide-react"
import type { Trade } from "@/trade"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { dash, qty, usd2 } from "./format"

const columns: Array<ColumnDef<Trade>> = [
  {
    accessorKey: "tradedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date <ArrowUpDown className="ml-2 size-3" />
      </Button>
    ),
    cell: ({ row }) => format(row.original.tradedAt, "yyyy-MM-dd"),
  },
  {
    accessorKey: "side",
    header: "Side",
    cell: ({ row }) => (
      <Badge
        variant={row.original.side === "buy" ? "default" : "secondary"}
        className={
          row.original.side === "buy"
            ? "bg-green-600 text-white hover:bg-green-600/90"
            : ""
        }
      >
        {row.original.side}
      </Badge>
    ),
  },
  {
    accessorKey: "quantity",
    header: () => <div className="text-right">Qty</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">{qty.format(row.original.quantity)}</div>
    ),
  },
  {
    accessorKey: "pricePerShare",
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">{usd2.format(row.original.pricePerShare)}</div>
    ),
  },
  {
    id: "total",
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {usd2.format(row.original.quantity * row.original.pricePerShare)}
      </div>
    ),
  },
  {
    accessorKey: "fees",
    header: () => <div className="text-right">Fees</div>,
    cell: ({ row }) => (
      <div className="text-muted-foreground text-right tabular-nums">
        {usd2.format(row.original.fees)}
      </div>
    ),
  },
  {
    accessorKey: "fxRate",
    header: () => <div className="text-right">FX</div>,
    cell: ({ row }) => (
      <div className="text-muted-foreground text-right tabular-nums">
        {row.original.fxRate != null ? row.original.fxRate.toFixed(2) : dash}
      </div>
    ),
  },
]

export function TradeHistoryCard({ trades }: { trades: Array<Trade> }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "tradedAt", desc: true },
  ])

  const table = useReactTable({
    data: trades,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  if (trades.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No trades recorded.</p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {table.getPageCount() > 1 ? (
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
