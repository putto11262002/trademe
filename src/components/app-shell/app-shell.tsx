import { Suspense, useState, useRef, useCallback, type ReactNode } from "react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { getCurrentUserFn } from "@/auth"
import { QueryErrorBoundary } from "@/components/query-error-boundary"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ChatPanel } from "@/components/chat/chat-panel"
import { AppHeader } from "./app-header"
import { AppSidebar } from "./app-sidebar"
import { AuthError } from "./auth-error"
import { AuthSplash } from "./auth-splash"
import { MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

const MIN_CHAT_WIDTH = 320
const MAX_CHAT_WIDTH = 640
const DEFAULT_CHAT_WIDTH = 380

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <QueryErrorBoundary fallback={AuthError}>
      <Suspense fallback={<AuthSplash />}>
        <AppShellInner>{children}</AppShellInner>
      </Suspense>
    </QueryErrorBoundary>
  )
}

function AppShellInner({ children }: { children: ReactNode }) {
  const [chatOpen, setChatOpen] = useState(true)
  const [mobileView, setMobileView] = useState<"app" | "chat">("app")
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH)
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  useSuspenseQuery({
    queryKey: ["currentUser"],
    queryFn: () => getCurrentUserFn(),
    staleTime: Infinity,
  })

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!isResizing.current) return
    const delta = startX.current - e.clientX
    setChatWidth(Math.min(MAX_CHAT_WIDTH, Math.max(MIN_CHAT_WIDTH, startWidth.current + delta)))
  }, [])

  const onPointerUp = useCallback(() => {
    isResizing.current = false
    document.removeEventListener("pointermove", onPointerMove)
    document.removeEventListener("pointerup", onPointerUp)
  }, [onPointerMove])

  function startResize(e: React.PointerEvent) {
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = chatWidth
    document.addEventListener("pointermove", onPointerMove)
    document.addEventListener("pointerup", onPointerUp)
    e.preventDefault()
  }

  return (
    <TooltipProvider>
      {/* ── Desktop (lg+): side-by-side ── */}
      <div className="hidden lg:flex h-svh overflow-hidden">
        {/* App side */}
        <div className="flex flex-1 min-w-0">
          <AppSidebar />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <AppHeader />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>

        {/* Resize handle */}
        {chatOpen && (
          <div
            onPointerDown={startResize}
            className="w-px shrink-0 cursor-col-resize bg-border hover:bg-primary/40 transition-colors"
          />
        )}

        {/* Chat panel */}
        {chatOpen ? (
          <div style={{ width: chatWidth }} className="shrink-0 flex flex-col overflow-hidden">
            <ChatPanel onClose={() => setChatOpen(false)} />
          </div>
        ) : (
          <button
            onClick={() => setChatOpen(true)}
            className="shrink-0 flex items-center justify-center w-8 border-l border-border hover:bg-muted transition-colors"
            aria-label="Open chat"
          >
            <MessageSquare className="size-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* ── Mobile (<lg): top pill toggle ── */}
      <div className="flex lg:hidden flex-col h-svh overflow-hidden">
        {/* Top pill toggle */}
        <div className="flex h-12 shrink-0 items-center justify-center border-b border-border bg-background">
          <div className="flex items-center gap-0.5 rounded-full border border-border bg-muted p-1">
            <button
              onClick={() => setMobileView("app")}
              className={cn(
                "rounded-full px-4 py-1 text-sm font-medium transition-colors",
                mobileView === "app"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              App
            </button>
            <button
              onClick={() => setMobileView("chat")}
              className={cn(
                "rounded-full px-4 py-1 text-sm font-medium transition-colors",
                mobileView === "chat"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Chat
            </button>
          </div>
        </div>

        {/* Active view */}
        {mobileView === "app" ? (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <AppSidebar />
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
              <AppHeader />
              <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatPanel onClose={() => setMobileView("app")} />
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
