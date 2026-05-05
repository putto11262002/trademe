import { useRef, useEffect, useState } from "react"
import { useAgent } from "agents/react"
import { useAgentChat } from "agents/ai-react"
import type { UIMessage, UIDataTypes, UITools } from "ai"
import { ArrowUp, Bot, ChevronUp, Trash2, X } from "lucide-react"
import { Streamdown } from "streamdown"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
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
    <>
      {/* Full-screen chat overlay — true full screen, covers sidebar too */}
      {open && (
        <div className="fixed inset-0 z-40 bg-background flex flex-col">
          {/* Header — no border */}
          <div className="flex h-14 shrink-0 items-center justify-end px-4 gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground size-8"
                onClick={clearHistory}
                disabled={isStreaming}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground size-8"
              onClick={onToggle}
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Messages — padded bottom so content clears the floating input */}
          <div className="flex-1 overflow-y-auto px-6 py-4 pb-36">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-center text-sm mt-8">
                Ask me about your portfolio, a stock price, or recent news.
              </p>
            ) : (
              <div className="mx-auto max-w-3xl space-y-4">
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

          {/* Floating input — absolute so it has no background region of its own */}
          <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
            <div className="mx-auto max-w-3xl pointer-events-auto">
              <InputGroup className="border-border bg-background shadow-xl">
                <InputGroupTextarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your portfolio…"
                  className="max-h-32 px-4 pt-4 text-sm"
                  rows={2}
                  disabled={isStreaming}
                  autoFocus
                />
                <InputGroupAddon align="block-end" className="justify-end">
                  <InputGroupButton
                    size="icon-sm"
                    variant="default"
                    onClick={submit}
                    disabled={isStreaming || !input.trim()}
                  >
                    <ArrowUp />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
        </div>
      )}

      {/* Floating pill — hidden when chat is open */}
      {!open && (
        <div className="fixed bottom-5 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <button
            onClick={onToggle}
            className="pointer-events-auto border-border bg-background hover:bg-muted flex items-center gap-2 rounded-full border px-3.5 py-2 shadow-lg transition-colors"
          >
            <Bot className="text-muted-foreground size-4" />
            <span className="text-sm font-medium">Assistant</span>
            {isStreaming ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">thinking…</Badge>
            ) : (
              <span className="bg-green-500 size-1.5 rounded-full" />
            )}
            <ChevronUp className="text-muted-foreground size-3.5" />
          </button>
        </div>
      )}
    </>
  )
}
