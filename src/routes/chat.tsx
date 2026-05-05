import { useRef, useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useAgent } from "agents/react"
import { useAgentChat } from "agents/ai-react"
import type { UIMessage, UIDataTypes, UITools } from "ai"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/chat")({ component: ChatPage })

const MOCK_USER_ID = "usr_demo_01"

type AnyPart = UIMessage<unknown, UIDataTypes, UITools>["parts"][number]

function ToolPart({ part }: { part: AnyPart }) {
  if (!part.type.startsWith("tool-") && part.type !== "dynamic-tool") return null

  const toolName =
    part.type === "dynamic-tool"
      ? (part as { toolName: string }).toolName
      : part.type.replace(/^tool-/, "")

  const p = part as {
    state: string
    input?: unknown
    output?: unknown
    errorText?: string
  }

  return (
    <div className="border-border w-full max-w-[85%] space-y-1">
      <div className="border-border rounded-lg border p-3 text-xs">
        <div className="text-muted-foreground mb-1 font-mono font-medium">
          ↳ tool: {toolName}
          <span className="ml-2 opacity-60">[{p.state}]</span>
        </div>
        {p.input !== undefined && (
          <pre className="text-foreground/70 overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(p.input, null, 2)}
          </pre>
        )}
      </div>
      {p.state === "output-available" && p.output !== undefined && (
        <div className="border-border rounded-lg border p-3 text-xs">
          <div className="text-muted-foreground mb-1 font-mono font-medium">
            ↳ result: {toolName}
          </div>
          <pre className="text-foreground/60 overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(p.output, null, 2)}
          </pre>
        </div>
      )}
      {p.state === "output-error" && (
        <div className="border-border rounded-lg border border-destructive/30 p-3 text-xs">
          <span className="text-destructive">error: {p.errorText}</span>
        </div>
      )}
    </div>
  )
}

function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
      <div className="text-muted-foreground px-1 text-[11px] font-medium uppercase tracking-wide">
        {isUser ? "You" : "Assistant"}
      </div>

      {message.parts.map((part, i) => {
        if (part.type === "text") {
          return (
            <div
              key={i}
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                isUser
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted rounded-bl-sm",
              )}
            >
              {part.text}
            </div>
          )
        }

        if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
          return <ToolPart key={i} part={part} />
        }

        return null
      })}
    </div>
  )
}

function ChatPage() {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState("")

  const agent = useAgent({ agent: "chat", name: MOCK_USER_ID })

  const { messages, sendMessage, status, clearHistory } = useAgentChat({ agent })

  const isStreaming = status === "streaming" || status === "submitted"

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function submit() {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput("")
    sendMessage({ text })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-border flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">Chat</span>
          {isStreaming && (
            <Badge variant="secondary" className="text-xs">
              thinking…
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground text-xs"
          onClick={clearHistory}
          disabled={messages.length === 0 || isStreaming}
        >
          Clear history
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="space-y-6 px-6 py-6">
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-center text-sm">
              Ask me about your portfolio, a stock price, or recent market news.
            </p>
          ) : (
            messages.map((m) => <Message key={m.id} message={m} />)
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Input */}
      <div className="flex gap-3 px-6 py-4">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your portfolio…"
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
          disabled={isStreaming}
        />
        <Button onClick={submit} disabled={isStreaming || !input.trim()} className="shrink-0">
          Send
        </Button>
      </div>
    </div>
  )
}
