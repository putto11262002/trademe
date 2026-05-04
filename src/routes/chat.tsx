import { createFileRoute } from "@tanstack/react-router"
import { MessageSquare } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

export const Route = createFileRoute("/chat")({ component: ChatPage })

function ChatPage() {
  return (
    <div className="p-6">
      <Empty>
        <EmptyHeader>
          <MessageSquare className="text-muted-foreground size-10" />
          <EmptyTitle>Chat — coming soon</EmptyTitle>
          <EmptyDescription>
            The portfolio-aware AI agent lands later in v0.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
