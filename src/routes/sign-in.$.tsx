import { createFileRoute } from "@tanstack/react-router"
import { SignIn } from "@clerk/tanstack-react-start"

export const Route = createFileRoute("/sign-in/$")({
  component: SignInPage,
})

function SignInPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <SignIn />
    </div>
  )
}
