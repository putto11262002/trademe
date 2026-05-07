import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/chat")({
  beforeLoad: () => { throw redirect({ to: "/" }) },
})
