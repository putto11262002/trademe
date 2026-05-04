import { Link, useLocation } from "@tanstack/react-router"
import { LayoutDashboard, MessageSquare, TrendingUp } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/trades", label: "Trades", icon: TrendingUp },
  { to: "/chat", label: "Chat", icon: MessageSquare },
] as const

export function AppSidebar() {
  const location = useLocation()
  return (
    <nav
      aria-label="Primary"
      className="bg-sidebar text-sidebar-foreground border-sidebar-border flex h-svh w-14 flex-col items-center gap-1 border-r py-3"
    >
      <Link
        to="/"
        aria-label="TradeMe home"
        className="mb-3 flex size-8 items-center justify-center"
      >
        <img src="/logo.png" alt="" className="size-8 object-contain" />
      </Link>
      {NAV.map(({ to, label, icon: Icon }) => {
        const active =
          to === "/" ? location.pathname === "/" : location.pathname.startsWith(to)
        return (
          <Tooltip key={to} delayDuration={150}>
            <TooltipTrigger asChild>
              <Link
                to={to}
                aria-label={label}
                className={cn(
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex size-9 items-center justify-center rounded-md transition-colors",
                  active &&
                    "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        )
      })}
    </nav>
  )
}
