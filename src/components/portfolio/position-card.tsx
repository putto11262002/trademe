import { TrendingDown, TrendingUp } from "lucide-react"
import type { EnrichedPosition } from "@/trade"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { cn } from "@/lib/utils"
import { pct, qty, thb, usd } from "./format"

export function PositionCard({ position }: { position: EnrichedPosition }) {
  const isUp = position.unrealizedPnLUSD >= 0
  const Icon = isUp ? TrendingUp : TrendingDown

  return (
    <Item variant="outline">
      <ItemMedia variant="image">
        <Avatar className="size-full rounded-none">
          {position.logoUrl ? (
            <AvatarImage src={position.logoUrl} alt="" className="object-contain" />
          ) : null}
          <AvatarFallback className="rounded-xl text-xs">
            {position.ticker.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{position.ticker}</ItemTitle>
        <ItemDescription>{position.name}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Badge
          variant={isUp ? "default" : "destructive"}
          className={cn("gap-1", isUp && "bg-green-600 text-white hover:bg-green-600/90")}
        >
          <Icon className="size-3" />
          <span className="tabular-nums">{pct(position.unrealizedPnLPct)}</span>
        </Badge>
      </ItemActions>
      <ItemFooter>
        <div className="tabular-nums">
          <span className="font-medium">{thb.format(position.valueTHB)}</span>
          <span className="text-muted-foreground ml-2 text-xs">
            {usd.format(position.valueUSD)}
          </span>
        </div>
        <div className="text-muted-foreground flex gap-3 text-xs tabular-nums">
          <span>
            {qty.format(position.netQuantity)} sh · avg {usd.format(position.avgCost)}
          </span>
          <span>{usd.format(position.currentPriceUSD)}</span>
        </div>
      </ItemFooter>
    </Item>
  )
}
