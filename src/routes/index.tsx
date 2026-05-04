import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/")({ component: App })

type Health =
  | { ok: true; testUserCount: number }
  | { ok: false; error: string }

function App() {
  const { data, isLoading, isError } = useQuery<Health>({
    queryKey: ["health"],
    queryFn: () => fetch("/api/health").then((r) => r.json()),
    retry: false,
  })

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">TradeMe</CardTitle>
            <Badge variant="secondary">alpha</Badge>
          </div>
          <CardDescription>Trading dashboard — early scaffold</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">
              Database
            </div>
            {isLoading ? (
              <Skeleton className="h-5 w-40" />
            ) : isError || !data?.ok ? (
              <div className="text-destructive text-sm">
                {data && !data.ok ? data.error : "Unreachable"}
              </div>
            ) : (
              <div className="text-sm">
                <span className="font-medium text-green-600">Connected</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {data.testUserCount} test users
                </span>
              </div>
            )}
          </div>
          <Button asChild className="w-full" variant="outline">
            <a href="/api/health" target="_blank" rel="noreferrer">
              View raw /api/health
            </a>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
