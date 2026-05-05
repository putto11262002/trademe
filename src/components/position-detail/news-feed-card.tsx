import { formatDistanceToNow } from "date-fns"
import { ExternalLink } from "lucide-react"
import type { NewsItem } from "@/market"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"

const MAX_ITEMS = 12

export function NewsFeedCard({ news }: { news: Array<NewsItem> }) {
  const items = news.slice(0, MAX_ITEMS)
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Recent news</h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No recent news.</p>
      ) : (
        <ItemGroup>
          {items.map((n) => (
            <Item key={n.id} asChild variant="outline">
              <a href={n.url} target="_blank" rel="noreferrer">
                <ItemContent>
                  <ItemTitle className="line-clamp-2 font-medium">{n.headline}</ItemTitle>
                  <ItemDescription>
                    {n.source} · {formatDistanceToNow(n.publishedAt, { addSuffix: true })}
                  </ItemDescription>
                </ItemContent>
                <ExternalLink className="text-muted-foreground size-3.5 shrink-0" />
              </a>
            </Item>
          ))}
        </ItemGroup>
      )}
    </div>
  )
}
