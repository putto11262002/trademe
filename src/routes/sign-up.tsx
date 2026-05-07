import { createFileRoute } from "@tanstack/react-router"
import { SignUp } from "@clerk/tanstack-react-start"

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <SignUp forceRedirectUrl="/welcome" />
    </div>
  )
}
