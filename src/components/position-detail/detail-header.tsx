import { Link } from "@tanstack/react-router"
import { ArrowLeft, ExternalLink, TrendingDown, TrendingUp } from "lucide-react"
import type { CompanyProfile, Quote } from "@/market"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { pct, usd2 } from "./format"

export function DetailHeader({
  ticker,
  profile,
  quote,
}: {
  ticker: string
  profile: CompanyProfile
  quote: Quote
}) {
  const isUp = quote.change >= 0
  const Icon = isUp ? TrendingUp : TrendingDown

  return (
    <div className="space-y-3">
      <Button asChild variant="ghost" size="sm" className="-ml-2 h-auto px-2 py-1">
        <Link to="/positions">
          <ArrowLeft className="size-4" />
          Back to positions
        </Link>
      </Button>
      <div className="flex flex-wrap items-start gap-4">
        <Avatar className="size-12 rounded-xl">
          {profile.logoUrl ? (
            <AvatarImage src={profile.logoUrl} alt="" className="object-contain" />
          ) : null}
          <AvatarFallback className="rounded-xl text-sm">
            {ticker.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-2xl font-semibold">{ticker}</h1>
            <span className="text-muted-foreground truncate">{profile.name}</span>
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span>{profile.exchange}</span>
            {profile.industry ? <span>· {profile.industry}</span> : null}
            {profile.website ? (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground inline-flex items-center gap-1"
              >
                Website
                <ExternalLink className="size-3" />
              </a>
            ) : null}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular-nums">
            {usd2.format(quote.price)}
          </div>
          <Badge
            variant={isUp ? "default" : "destructive"}
            className={cn(
              "gap-1",
              isUp && "bg-green-600 text-white hover:bg-green-600/90",
            )}
          >
            <Icon className="size-3" />
            <span className="tabular-nums">
              {isUp ? "+" : ""}
              {usd2.format(quote.change)} ({pct(quote.changePct)})
            </span>
          </Badge>
        </div>
      </div>
    </div>
  )
}
