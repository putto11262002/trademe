import { Component, type ErrorInfo, type ReactNode } from "react"
import { QueryErrorResetBoundary } from "@tanstack/react-query"
import { AlertTriangle, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

type FallbackProps = { error: Error; reset: () => void }

type BoundaryProps = {
  children: ReactNode
  onReset: () => void
  fallback: (props: FallbackProps) => ReactNode
}

class Boundary extends Component<BoundaryProps, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Query error:", error, info)
  }

  reset = () => {
    this.props.onReset()
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return this.props.fallback({ error: this.state.error, reset: this.reset })
    }
    return this.props.children
  }
}

export function DefaultQueryError({ error, reset }: FallbackProps) {
  return (
    <Empty>
      <EmptyHeader>
        <AlertTriangle className="text-destructive size-10" />
        <EmptyTitle>Failed to load</EmptyTitle>
        <EmptyDescription>{error.message}</EmptyDescription>
      </EmptyHeader>
      <Button variant="outline" onClick={reset}>
        <RotateCw className="size-4" />
        Retry
      </Button>
    </Empty>
  )
}

export function QueryErrorBoundary({
  children,
  fallback = DefaultQueryError,
}: {
  children: ReactNode
  fallback?: (props: FallbackProps) => ReactNode
}) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <Boundary onReset={reset} fallback={fallback}>
          {children}
        </Boundary>
      )}
    </QueryErrorResetBoundary>
  )
}
