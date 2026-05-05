import { formatDistanceToNow } from "date-fns"
import { ExternalLink } from "lucide-react"
import type { NewsItem } from "@/market"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const MAX_ITEMS = 12

export function NewsFeedCard({ news }: { news: Array<NewsItem> }) {
  const items = news.slice(0, MAX_ITEMS)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent news</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No recent news.</p>
        ) : (
          <ul className="divide-border divide-y">
            {items.map((n) => (
              <li key={n.id} className="py-3 first:pt-0 last:pb-0">
                <a
                  href={n.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:bg-accent/40 group -mx-2 flex flex-col gap-1 rounded-md px-2 py-1"
                >
                  <div className="flex items-start gap-2">
                    <span className="group-hover:text-primary line-clamp-2 flex-1 text-sm font-medium">
                      {n.headline}
                    </span>
                    <ExternalLink className="text-muted-foreground mt-0.5 size-3 shrink-0" />
                  </div>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
                    <span>{n.source}</span>
                    <span>·</span>
                    <span>
                      {formatDistanceToNow(n.publishedAt, { addSuffix: true })}
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
