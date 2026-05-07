import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { TradeForm } from "@/components/trade/trade-form"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_app/trades/new")({ component: NewTradePage })

function NewTradePage() {
  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/trades">
          <ArrowLeft className="size-4" />
          Back to trades
        </Link>
      </Button>
      <header>
        <h1 className="text-2xl font-semibold">Add trade</h1>
        <p className="text-muted-foreground text-sm">
          Enter a US-stock buy or sell.
        </p>
      </header>
      <TradeForm />
    </div>
  )
}
