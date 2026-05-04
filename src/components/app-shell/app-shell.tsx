import { Suspense, type ReactNode } from "react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { getCurrentUserFn } from "@/auth"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppHeader } from "./app-header"
import { AppSidebar } from "./app-sidebar"
import { AuthSplash } from "./auth-splash"

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AuthSplash />}>
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  )
}

function AppShellInner({ children }: { children: ReactNode }) {
  useSuspenseQuery({
    queryKey: ["currentUser"],
    queryFn: () => getCurrentUserFn(),
    staleTime: Infinity,
  })

  return (
    <TooltipProvider>
      <div className="flex h-svh">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
