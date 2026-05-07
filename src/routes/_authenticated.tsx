import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { auth } from "@clerk/tanstack-react-start/server"
import { AppShell } from "@/components/app-shell"
import { getCurrentUserFn } from "@/auth"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    const { userId } = await auth()
    if (!userId) throw redirect({ to: "/sign-in" })

    const user = await context.queryClient.ensureQueryData({
      queryKey: ["currentUser"],
      queryFn: () => getCurrentUserFn(),
      staleTime: Infinity,
    })

    if (!user) throw redirect({ to: "/welcome" })

    return { user }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})
