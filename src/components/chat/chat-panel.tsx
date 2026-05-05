import { useRef, useEffect, useState } from "react"
import { useAgent } from "agents/react"
import { useAgentChat } from "agents/ai-react"
import type { UIMessage, UIDataTypes, UITools } from "ai"
import { ChevronDown, MessageSquare, Trash2 } from "lucide-react"
import { Streamdown } from "streamdown"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const MOCK_USER_ID = "usr_demo_01"

type AnyPart = UIMessage<unknown, UIDataTypes, UITools>["parts"][number]

function ToolPart({ part }: { part: AnyPart }) {
  if (!part.type.startsWith("tool-") && part.type !== "dynamic-tool") return null

  const toolName =
    part.type === "dynamic-tool"
      ? (part as { toolName: string }).toolName
      : part.type.replace(/^tool-/, "")

  const p = part as { state: string; input?: unknown; output?: unknown; errorText?: string }

  return (
    <div className="space-y-1">
      <div className="border-border rounded-lg border p-2.5 text-xs">
        <div className="text-muted-foreground mb-1 font-mono font-medium">
          ↳ {toolName}
          <span className="ml-1.5 opacity-50">[{p.state}]</span>
        </div>
        {p.input !== undefined && Object.keys(p.input as object).length > 0 && (
          <pre className="text-foreground/60 overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(p.input, null, 2)}
          </pre>
        )}
      </div>
      {p.state === "output-available" && p.output !== undefined && (
        <div className="border-border rounded-lg border p-2.5 text-xs">
          <div className="text-muted-foreground mb-1 font-mono font-medium">↳ result: {toolName}</div>
          <pre className="text-foreground/50 overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(p.output, null, 2)}
          </pre>
        </div>
      )}
      {p.state === "output-error" && (
        <div className="border-destructive/30 rounded-lg border p-2.5 text-xs">
          <span className="text-destructive">{p.errorText}</span>
        </div>
      )}
    </div>
  )
}

function Message({ message, isStreaming }: { message: UIMessage; isStreaming: boolean }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
      {message.parts.map((part, i) => {
        if (part.type === "text") {
          if (isUser) {
            return (
              <div
                key={i}
                className="bg-primary text-primary-foreground max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap"
              >
                {part.text}
              </div>
            )
          }
          return (
            <div key={i} className="prose prose-sm dark:prose-invert max-w-[85%]">
              <Streamdown isAnimating={isStreaming}>{part.text}</Streamdown>
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

export function ChatPanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState("")

  const agent = useAgent({ agent: "chat", name: MOCK_USER_ID })
  const { messages, sendMessage, status, clearHistory } = useAgentChat({ agent })

  const isStreaming = status === "streaming" || status === "submitted"

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

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
    <div
      className={cn(
        "border-border bg-background flex flex-col border-t transition-[height] duration-200 ease-in-out",
        open ? "h-[480px]" : "h-11",
      )}
    >
      {/* Toggle bar */}
      <button
        onClick={onToggle}
        className="hover:bg-muted/50 flex h-11 w-full shrink-0 items-center justify-between px-4 text-left transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="text-muted-foreground size-4" />
          <span className="text-sm font-medium">Chat</span>
          {isStreaming && (
            <Badge variant="secondary" className="text-xs">thinking…</Badge>
          )}
          {!isStreaming && messages.length > 0 && (
            <span className="text-muted-foreground text-xs">{messages.length} messages</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {open && messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground size-7"
              onClick={(e) => { e.stopPropagation(); clearHistory() }}
              disabled={isStreaming}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
          <ChevronDown
            className={cn(
              "text-muted-foreground size-4 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </div>
      </button>

      {/* Body — only rendered when open */}
      {open && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-center text-sm">
                Ask me about your portfolio, a stock price, or recent news.
              </p>
            ) : (
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <Message
                    key={m.id}
                    message={m}
                    isStreaming={isStreaming && i === messages.length - 1}
                  />
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-border flex gap-2 border-t px-4 py-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your portfolio…"
              className="min-h-[36px] max-h-24 resize-none text-sm"
              rows={1}
              disabled={isStreaming}
            />
            <Button
              size="sm"
              onClick={submit}
              disabled={isStreaming || !input.trim()}
              className="shrink-0 self-end"
            >
              Send
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
