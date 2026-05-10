import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { getCurrentUserFn } from "@/auth"
import { Button } from "@/components/ui/button"

const TIMEOUT_MS = 30_000
const POLL_INTERVAL_MS = 2_000

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
})

function WelcomePage() {
  const router = useRouter()
  const [timedOut, setTimedOut] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: user, refetch } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => getCurrentUserFn(),
    refetchInterval: (query) => (query.state.data ? false : POLL_INTERVAL_MS),
    staleTime: 0,
  })

  useEffect(() => {
    timeoutRef.current = setTimeout(() => setTimedOut(true), TIMEOUT_MS)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (user) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      router.navigate({ to: "/", replace: true })
    }
  }, [user, router])

  const handleRetry = () => {
    setTimedOut(false)
    timeoutRef.current = setTimeout(() => setTimedOut(true), TIMEOUT_MS)
    refetch()
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-6">
      <img
        src="/logo.png"
        alt="Pholio"
        className={timedOut ? "size-12 opacity-40" : "size-12 animate-pulse"}
      />
      {timedOut ? (
        <>
          <p className="text-muted-foreground text-sm">
            Taking longer than expected. Please try again.
          </p>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            Retry
          </Button>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">Setting up your account…</p>
      )}
    </div>
  )
}
