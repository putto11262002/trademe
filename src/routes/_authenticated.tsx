import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { AppShell } from "@/components/app-shell"
import { getCurrentUserFn } from "@/auth"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    const state = await context.queryClient.ensureQueryData({
      queryKey: ["currentUser"],
      queryFn: () => getCurrentUserFn(),
      staleTime: Infinity,
    })
    if (state.status === "unauthenticated") throw redirect({ to: "/sign-in" })
    if (state.status === "no_db_user") throw redirect({ to: "/welcome" })
    return { user: state.user }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})
