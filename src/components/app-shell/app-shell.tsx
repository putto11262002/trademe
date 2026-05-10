import { Suspense, useState, useRef, useCallback, type ReactNode } from "react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { getCurrentUserFn } from "@/auth"
import { QueryErrorBoundary } from "@/components/query-error-boundary"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ChatPanel } from "@/components/chat/chat-panel"
import { AppSidebar } from "./app-sidebar"
import { UserMenu } from "./user-menu"
import { AuthError } from "./auth-error"
import { AuthSplash } from "./auth-splash"
import { ChevronDown, LayoutDashboard, MessageSquare, PieChart, TrendingUp, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Link } from "@tanstack/react-router"

const MIN_CHAT_WIDTH = 320
const MAX_CHAT_WIDTH = 640
const DEFAULT_CHAT_WIDTH = 500

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
  const [isDragging, setIsDragging] = useState(false)
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
    setIsDragging(false)
    document.removeEventListener("pointermove", onPointerMove)
    document.removeEventListener("pointerup", onPointerUp)
  }, [onPointerMove])

  function startResize(e: React.PointerEvent) {
    isResizing.current = true
    setIsDragging(true)
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
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>

        {/* Chat card — drag handle is the left edge of the card */}
        {chatOpen ? (
          <div
            style={{ width: chatWidth }}
            className={cn("shrink-0 flex my-2 mr-2 rounded-4xl overflow-hidden border-2 shadow-lg transition-colors", isDragging ? "border-primary" : "border-primary/70")}
          >
            {/* Drag handle — left edge of the card */}
            <div
              onPointerDown={startResize}
              className="w-1 shrink-0 cursor-col-resize rounded-l-4xl"
            />
            {/* Chat content */}
            <div className="flex-1 flex flex-col min-w-0">
              <ChatPanel />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setChatOpen(true)}
            className="shrink-0 flex items-center justify-center w-8 hover:bg-muted transition-colors"
            aria-label="Open chat"
          >
            <MessageSquare className="size-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* ── Mobile (<lg): floating pill toggle ── */}
      <div className="relative flex lg:hidden h-svh overflow-hidden">
        {/* Floating pill */}
        <div className="absolute top-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-border bg-background/80 backdrop-blur-sm shadow-lg p-1">
            {/* App dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={() => setMobileView("app")}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-4 py-1 text-sm font-medium transition-colors",
                    mobileView === "app"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  App <ChevronDown className="size-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem asChild>
                  <Link to="/" onClick={() => setMobileView("app")} className="flex items-center gap-2">
                    <LayoutDashboard className="size-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/positions" onClick={() => setMobileView("app")} className="flex items-center gap-2">
                    <PieChart className="size-4" /> Positions
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/trades" onClick={() => setMobileView("app")} className="flex items-center gap-2">
                    <TrendingUp className="size-4" /> Trades
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/usage" onClick={() => setMobileView("app")} className="flex items-center gap-2">
                    <Zap className="size-4" /> Usage
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <div className="w-full"><UserMenu /></div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Chat toggle */}
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

        {/* Active view — full bleed, pill floats above */}
        {mobileView === "app" ? (
          <div className="flex h-full w-full overflow-hidden">
            <div className="hidden lg:block"><AppSidebar /></div>
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
              <main className="flex-1 overflow-y-auto pt-16">{children}</main>
            </div>
          </div>
        ) : (
          <div className="h-full w-full overflow-hidden pt-16">
            <ChatPanel />
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
