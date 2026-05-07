import { useRouteContext } from "@tanstack/react-router"

export function useCurrentUser() {
  return useRouteContext({ from: "/_authenticated" }).user
}
