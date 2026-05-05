import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"
import { getPositionDetailFn } from "@/trade"
import {
  AnalystSignalsCard,
  DetailHeader,
  EarningsCard,
  KeyStatsCard,
  NewsFeedCard,
  TradeHistoryCard,
  TradingViewChart,
  YourPositionCard,
} from "@/components/position-detail"
import { QueryErrorBoundary } from "@/components/query-error-boundary"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/positions/$ticker")({
  component: PositionDetailPage,
})

function PositionDetailPage() {
  const { ticker } = Route.useParams()
  const upper = ticker.toUpperCase()

  return (
    <div className="space-y-6 p-6">
      <QueryErrorBoundary>
        <Suspense fallback={<DetailSkeleton />}>
          <PositionDetail ticker={upper} />
        </Suspense>
      </QueryErrorBoundary>
    </div>
  )
}

function PositionDetail({ ticker }: { ticker: string }) {
  const { data } = useSuspenseQuery({
    queryKey: ["position", ticker],
    queryFn: () => getPositionDetailFn({ data: { ticker } }),
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="space-y-6">
      <DetailHeader
        ticker={data.ticker}
        profile={data.profile}
        quote={data.quote}
      />

      <TradingViewChart ticker={data.ticker} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <YourPositionCard position={data.position} fxRate={data.fxRate} />
          <TradeHistoryCard trades={data.trades} />
        </div>
        <div className="space-y-6">
          <KeyStatsCard quote={data.quote} fundamentals={data.fundamentals} />
          <AnalystSignalsCard
            quote={data.quote}
            priceTarget={data.priceTarget}
            recommendation={data.recommendation}
          />
        </div>
      </div>

      <NewsFeedCard news={data.news} />

      <EarningsCard next={data.nextEarnings} past={data.pastEarnings} />
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16" />
      <Skeleton className="h-[420px]" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}
