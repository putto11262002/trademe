import { createFileRoute } from "@tanstack/react-router"
import { TrendingUp } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

export const Route = createFileRoute("/trades")({ component: TradesPage })

function TradesPage() {
  return (
    <div className="p-6">
      <Empty>
        <EmptyHeader>
          <TrendingUp className="text-muted-foreground size-10" />
          <EmptyTitle>Trades — coming soon</EmptyTitle>
          <EmptyDescription>
            Manual entry and slip ingestion land in the next slice.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
