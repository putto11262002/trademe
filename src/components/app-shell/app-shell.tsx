import type { ReactNode } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppHeader } from "./app-header"
import { AppSidebar } from "./app-sidebar"

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <div className="flex min-h-svh">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
