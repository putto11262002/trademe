import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"
import { getDailyUsageFn, getUsageSummaryFn } from "@/agent/usage/functions"
import { DailyChart } from "@/components/usage/daily-chart"
import { QuotaCard } from "@/components/usage/summary-cards"
import { QueryErrorBoundary } from "@/components/query-error-boundary"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/_authenticated/usage")({ component: UsagePage })

function UsagePage() {
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Usage</h1>
        <p className="text-muted-foreground text-sm">AI run costs and quota for the current month.</p>
      </header>
      <QueryErrorBoundary>
        <Suspense fallback={<UsageSkeleton />}>
          <UsageContent />
        </Suspense>
      </QueryErrorBoundary>
    </div>
  )
}

function UsageContent() {
  const { data: summary } = useSuspenseQuery({
    queryKey: ["usage", "summary"],
    queryFn: () => getUsageSummaryFn(),
  })
  const { data: daily } = useSuspenseQuery({
    queryKey: ["usage", "daily"],
    queryFn: () => getDailyUsageFn(),
  })

  return (
    <div className="space-y-6">
      <QuotaCard summary={summary} />
      <DailyChart data={daily} />
    </div>
  )
}

function UsageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}
