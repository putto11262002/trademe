import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { Plus, TrendingUp } from "lucide-react"
import { Suspense } from "react"
import { listTradesFn } from "@/trade"
import { TradesDataTable } from "@/components/trade/trades-data-table"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/trades/")({ component: TradesPage })

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
        <Button asChild>
          <Link to="/trades/new">
            <Plus className="size-4" />
            Add trade
          </Link>
        </Button>
      </header>

      <Suspense fallback={<SectionSkeleton title="All trades" />}>
        <TradeList />
      </Suspense>
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
          <Button asChild>
            <Link to="/trades/new">
              <Plus className="size-4" />
              Add trade
            </Link>
          </Button>
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
