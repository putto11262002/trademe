import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { TrendingUp } from "lucide-react"
import { Suspense } from "react"
import { getPortfolioDashboardFn } from "@/trade"
import { CompositionDonut } from "@/components/portfolio/composition-donut"
import { PortfolioHero } from "@/components/portfolio/portfolio-hero"
import { PositionCard } from "@/components/portfolio/position-card"
import { SectorAllocationCard } from "@/components/portfolio/sector-allocation"
import { QueryErrorBoundary } from "@/components/query-error-boundary"
import { AddTradeMenu } from "@/components/trade/add-trade-menu"
import { Button } from "@/components/ui/button"
import { ItemGroup } from "@/components/ui/item"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Your portfolio at a glance.
        </p>
      </header>
      <QueryErrorBoundary>
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </Suspense>
      </QueryErrorBoundary>
    </div>
  )
}

function Dashboard() {
  const { data } = useSuspenseQuery({
    queryKey: ["portfolio"],
    queryFn: () => getPortfolioDashboardFn(),
    staleTime: 5 * 60 * 1000,
  })

  if (data.positions.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <TrendingUp className="text-muted-foreground size-10" />
          <EmptyTitle>No positions yet</EmptyTitle>
          <EmptyDescription>
            Add your first trade to start tracking your portfolio.
          </EmptyDescription>
        </EmptyHeader>
        <AddTradeMenu />
      </Empty>
    )
  }

  const top = [...data.positions]
    .sort((a, b) => b.valueTHB - a.valueTHB)
    .slice(0, 3)

  return (
    <div className="space-y-6">
      <PortfolioHero summary={data.summary} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CompositionDonut positions={data.positions} />
        <SectorAllocationCard allocation={data.summary.sectorAllocation} />
      </div>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Top positions</h2>
          <Button asChild variant="link" size="sm" className="h-auto p-0">
            <Link to="/positions">View all →</Link>
          </Button>
        </div>
        <ItemGroup>
          {top.map((p) => (
            <PositionCard key={p.ticker} position={p} />
          ))}
        </ItemGroup>
      </section>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-56" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  )
}
