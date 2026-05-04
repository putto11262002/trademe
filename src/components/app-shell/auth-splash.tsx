export function AuthSplash() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-4">
      <img
        src="/logo.png"
        alt=""
        className="size-16 animate-pulse object-contain"
      />
      <p className="text-muted-foreground animate-pulse text-sm">
        AI-powered investment dashboard
      </p>
    </div>
  )
}
