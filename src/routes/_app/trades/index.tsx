import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { TrendingUp } from "lucide-react"
import { Suspense } from "react"
import { listTradesFn } from "@/trade"
import { QueryErrorBoundary } from "@/components/query-error-boundary"
import { AddTradeMenu } from "@/components/trade/add-trade-menu"
import { TradesDataTable } from "@/components/trade/trades-data-table"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/_app/trades/")({ component: TradesPage })

function TradesPage() {
  return (
    <div className="space-y-8 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Trades</h1>
          <p className="text-muted-foreground text-sm">
            Your portfolio activity, manually entered for now.
          </p>
        </div>
        <AddTradeMenu />
      </header>

      <QueryErrorBoundary>
        <Suspense fallback={<SectionSkeleton title="All trades" />}>
          <TradeList />
        </Suspense>
      </QueryErrorBoundary>
    </div>
  )
}

function TradeList() {
  const { data } = useSuspenseQuery({
    queryKey: ["trades"],
    queryFn: () => listTradesFn(),
  })

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">All trades</h2>
      {data.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <TrendingUp className="text-muted-foreground size-10" />
            <EmptyTitle>No trades yet</EmptyTitle>
            <EmptyDescription>
              Add your first trade to start tracking your portfolio.
            </EmptyDescription>
          </EmptyHeader>
          <AddTradeMenu />
        </Empty>
      ) : (
        <TradesDataTable data={data} />
      )}
    </section>
  )
}

function SectionSkeleton({ title }: { title: string }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">{title}</h2>
      <Skeleton className="h-32 w-full" />
    </section>
  )
}
