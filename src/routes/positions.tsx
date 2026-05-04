import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { PieChart, Plus } from "lucide-react"
import { Suspense } from "react"
import { getPositionsFn } from "@/trade"
import { QueryErrorBoundary } from "@/components/query-error-boundary"
import { PositionsList } from "@/components/trade/positions-list"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/positions")({ component: PositionsPage })

function PositionsPage() {
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Positions</h1>
        <p className="text-muted-foreground text-sm">
          Aggregated holdings derived from your trade log.
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
    queryKey: ["positions"],
    queryFn: () => getPositionsFn(),
  })

  if (data.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <PieChart className="text-muted-foreground size-10" />
          <EmptyTitle>No positions yet</EmptyTitle>
          <EmptyDescription>
            Add a trade to start building your portfolio.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link to="/trades/new">
            <Plus className="size-4" />
            Add trade
          </Link>
        </Button>
      </Empty>
    )
  }

  return <PositionsList data={data} />
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
