import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { PieChart } from "lucide-react"
import { Suspense } from "react"
import { getPortfolioDashboardFn } from "@/trade"
import { HoldingsList } from "@/components/portfolio/holdings-list"
import { QueryErrorBoundary } from "@/components/query-error-boundary"
import { AddTradeMenu } from "@/components/trade/add-trade-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/positions/")({ component: PositionsPage })

function PositionsPage() {
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Positions</h1>
        <p className="text-muted-foreground text-sm">
          Aggregated holdings with live prices.
        </p>
      </header>
      <QueryErrorBoundary>
        <Suspense fallback={<PositionsSkeleton />}>
          <Positions />
        </Suspense>
      </QueryErrorBoundary>
    </div>
  )
}

function Positions() {
  const { data } = useSuspenseQuery({
    queryKey: ["portfolio"],
    queryFn: () => getPortfolioDashboardFn(),
    staleTime: 5 * 60 * 1000,
  })

  if (data.positions.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <PieChart className="text-muted-foreground size-10" />
          <EmptyTitle>No positions yet</EmptyTitle>
          <EmptyDescription>
            Add a trade to start building your portfolio.
          </EmptyDescription>
        </EmptyHeader>
        <AddTradeMenu />
      </Empty>
    )
  }

  return <HoldingsList positions={data.positions} />
}

function PositionsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  )
}
