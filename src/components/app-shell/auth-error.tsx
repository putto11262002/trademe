import { RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AuthError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <img src="/logo.png" alt="" className="size-16 object-contain opacity-60" />
      <div className="space-y-1 text-center">
        <p className="font-medium">Couldn't load your session</p>
        <p className="text-muted-foreground max-w-sm text-sm">{error.message}</p>
      </div>
      <Button variant="outline" onClick={reset}>
        <RotateCw className="size-4" />
        Retry
      </Button>
    </div>
  )
}
