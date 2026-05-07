import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { useAuth } from "@clerk/tanstack-react-start"
import { AppShell } from "@/components/app-shell"
import { getCurrentUserFn } from "@/auth"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData({
      queryKey: ["currentUser"],
      queryFn: () => getCurrentUserFn(),
      staleTime: Infinity,
    })
    return { user }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) return null

  if (!isSignedIn) {
    throw redirect({ to: "/sign-in" })
  }

  const { user } = Route.useRouteContext()

  if (!user) {
    throw redirect({ to: "/welcome" })
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
