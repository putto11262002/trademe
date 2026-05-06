import { useRef, useEffect, useLayoutEffect, useState } from "react"
import { useAgent } from "agents/react"
import { useAgentChat } from "agents/ai-react"
import type { UIMessage, UIDataTypes, UITools } from "ai"
import { AlertCircle, ArrowUp, Bot, Brain, CheckCircle2, ChevronDown, ChevronUp, Loader2, Trash2, X } from "lucide-react"
import { Streamdown, type Components } from "streamdown"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import { toolDisplayRegistry } from "@/agent/tool-display"
import { Separator } from "@/components/ui/separator"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MODELS,
  THINKING_LABELS,
  DEFAULT_MODEL,
  DEFAULT_THINKING,
  type ModelKey,
  type ThinkingLevel,
} from "@/agent/models"

const MOCK_USER_ID = "usr_demo_01"

const markdownComponents: Components = {
  h1: ({ node: _n, ...props }) => <h1 className="text-base font-semibold mt-3 mb-1" {...props} />,
  h2: ({ node: _n, ...props }) => <h2 className="text-sm font-semibold mt-2 mb-1" {...props} />,
  h3: ({ node: _n, ...props }) => <h3 className="text-sm font-medium mt-2 mb-0.5" {...props} />,
  table: ({ node: _n, ...props }) => (
    <ScrollArea className="w-full rounded-4xl border">
      <table className="min-w-full caption-bottom text-sm" {...props} />
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
  thead: ({ node: _n, ...props }) => <TableHeader {...props} />,
  tbody: ({ node: _n, ...props }) => <TableBody {...props} />,
  tr: ({ node: _n, ...props }) => <TableRow {...props} />,
  th: ({ node: _n, ...props }) => <TableHead {...props} />,
  td: ({ node: _n, ...props }) => <TableCell {...props} />,
}

type AnyPart = UIMessage<unknown, UIDataTypes, UITools>["parts"][number]

function toolPartRow(part: AnyPart) {
  const toolName =
    part.type === "dynamic-tool"
      ? (part as { toolName: string }).toolName
      : part.type.replace(/^tool-/, "")

  const p = part as { state: string; input?: unknown; output?: unknown; errorText?: string }
  const display = toolDisplayRegistry[toolName]

  const isLoading = p.state === "input-available" || p.state === "input-streaming" || p.state === "output-streaming"
  const isDone = p.state === "output-available"
  const isError = p.state === "output-error"

  const label = display?.label ?? toolName
  const loadingMsg =
    display == null ? `Running ${toolName}…`
    : typeof display.loadingMessage === "function"
    ? display.loadingMessage((p.input ?? {}) as Record<string, unknown>)
    : display.loadingMessage
  const resultMsg = isDone && display ? display.resultMessage(p.output) : null

  return { toolName, isLoading, isDone, isError, label, loadingMsg, resultMsg, errorText: p.state === "output-error" ? (p as { errorText?: string }).errorText : undefined }
}

function ToolGroup({ parts }: { parts: AnyPart[] }) {
  return (
    <div className="w-full overflow-hidden rounded-4xl border border-border">
      {parts.map((part, i) => {
        const { isLoading, isDone, isError, label, loadingMsg, resultMsg, errorText } = toolPartRow(part)
        return (
          <div key={i}>
            {i > 0 && <Separator />}
            <div className={cn(
              "flex items-center gap-2.5 px-4 py-3 text-xs",
              isError ? "text-destructive" : "text-muted-foreground",
            )}>
              {isLoading && <Loader2 className="size-3 shrink-0 animate-spin text-muted-foreground" />}
              {isDone && <CheckCircle2 className="size-3 shrink-0 text-green-500" />}
              {isError && <AlertCircle className="size-3 shrink-0 text-destructive" />}
              <span className="font-medium text-foreground">{label}</span>
              <span className="opacity-40">·</span>
              <span>{isError ? errorText : isDone ? resultMsg : loadingMsg}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ReasoningPart({ part, isStreaming }: { part: AnyPart; isStreaming: boolean }) {
  const [open, setOpen] = useState(false)
  const p = part as { reasoning?: string }
  const text = p.reasoning ?? ""
  if (!text && !isStreaming) return null

  return (
    <div className="border-border w-full overflow-hidden rounded-4xl border text-xs">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2.5 px-4 py-3 transition-colors"
      >
        {isStreaming && !open
          ? <Loader2 className="size-3 shrink-0 animate-spin" />
          : <Brain className="size-3 shrink-0" />
        }
        <span className="font-medium">Thinking</span>
        {!isStreaming && <span className="opacity-40">· {text.split(/\s+/).length} words</span>}
        <ChevronDown className={cn("ml-auto size-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-border border-t px-4 pb-4 pt-3">
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{text}</p>
        </div>
      )}
    </div>
  )
}

function Message({ message, isStreaming }: { message: UIMessage; isStreaming: boolean }) {
  const isUser = message.role === "user"

  type Group =
    | { kind: "text"; part: AnyPart; idx: number }
    | { kind: "reasoning"; part: AnyPart; idx: number }
    | { kind: "tools"; parts: AnyPart[] }

  const groups: Group[] = []
  for (const [idx, part] of message.parts.entries()) {
    const isTool = part.type.startsWith("tool-") || part.type === "dynamic-tool"
    if (isTool) {
      const last = groups[groups.length - 1]
      if (last?.kind === "tools") {
        last.parts.push(part)
      } else {
        groups.push({ kind: "tools", parts: [part] })
      }
    } else if (part.type === "reasoning") {
      groups.push({ kind: "reasoning", part, idx })
    } else {
      groups.push({ kind: "text", part, idx })
    }
  }

  return (
    <div className={cn("flex flex-col gap-5", isUser ? "items-end" : "items-start")}>
      {groups.map((group, gi) => {
        if (group.kind === "tools") {
          return <ToolGroup key={gi} parts={group.parts} />
        }
        if (group.kind === "reasoning") {
          return <ReasoningPart key={gi} part={group.part} isStreaming={isStreaming} />
        }
        if (group.part.type !== "text") return null
        if (isUser) {
          return (
            <div
              key={gi}
              className="bg-primary text-primary-foreground max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap"
            >
              {group.part.text}
            </div>
          )
        }
        return (
          <div key={gi} className="prose prose-sm dark:prose-invert w-full">
            <Streamdown isAnimating={isStreaming} components={markdownComponents}>{group.part.text}</Streamdown>
          </div>
        )
      })}
    </div>
  )
}

export function ChatPanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastUserMsgRef = useRef<HTMLDivElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)
  const lastAssistantRef = useRef<HTMLDivElement>(null)
  const prevSpacedElRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const justSubmittedRef = useRef(false)
  const hasInitialScrolledRef = useRef(false)
  const [input, setInput] = useState("")
  const [modelKey, setModelKey] = useState<ModelKey>(DEFAULT_MODEL)
  const [thinking, setThinking] = useState<ThinkingLevel>(DEFAULT_THINKING)

  const agent = useAgent({ agent: "chat", name: MOCK_USER_ID })
  const { messages, sendMessage, status, clearHistory } = useAgentChat({
    agent,
    body: () => ({ model: modelKey, thinking }),
  })

  const isStreaming = status === "streaming" || status === "submitted"
  const selectedModel = MODELS[modelKey]

  // On open: scroll to bottom once (no smooth — instant jump to latest)
  useEffect(() => {
    if (!open) { hasInitialScrolledRef.current = false; return }
    if (hasInitialScrolledRef.current || messages.length === 0) return
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
      hasInitialScrolledRef.current = true
    }
  }, [open, messages])

  // Single layout pass: set spacer height then scroll — order matters, space must exist before scroll
  useLayoutEffect(() => {
    if (!scrollContainerRef.current || !lastUserMsgRef.current) return
    const container = scrollContainerRef.current
    const containerStyle = window.getComputedStyle(container)
    const paddingTop = parseFloat(containerStyle.paddingTop)
    const paddingBottom = parseFloat(containerStyle.paddingBottom)
    const containerH = container.clientHeight
    const userMsgH = lastUserMsgRef.current.offsetHeight

    if (prevSpacedElRef.current) prevSpacedElRef.current.style.minHeight = ""
    const target = spacerRef.current ?? lastAssistantRef.current
    if (target) {
      const gap = parseFloat(window.getComputedStyle(target).marginTop)
      const height = Math.max(0, containerH - paddingTop - paddingBottom - userMsgH - gap)
      target.style.minHeight = `${height}px`
      prevSpacedElRef.current = target
    }

    if (open && justSubmittedRef.current) {
      justSubmittedRef.current = false
      const el = lastUserMsgRef.current
      const container = scrollContainerRef.current
      const elTop = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop
      container.scrollTop = elTop
    }
  }, [messages, open])

  function submit() {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput("")
    justSubmittedRef.current = true
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
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-4 pb-36">
            {messages.length === 0 ? (
              <p className="text-muted-foreground text-center text-sm mt-8">
                Ask me about your portfolio, a stock price, or recent news.
              </p>
            ) : (
              <div className="mx-auto max-w-3xl space-y-4">
                {messages.map((m, i) => {
                  const isLastUser = m.role === "user" && !messages.slice(i + 1).some(msg => msg.role === "user")
                  const isLastAssistant = m.role === "assistant" && !messages.slice(i + 1).some(msg => msg.role === "user")
                  return (
                    <div
                      key={m.id}
                      ref={isLastUser ? lastUserMsgRef : isLastAssistant ? lastAssistantRef : undefined}
                    >
                      <Message message={m} isStreaming={isStreaming && i === messages.length - 1} />
                    </div>
                  )
                })}
                {messages.length > 0 && messages[messages.length - 1].role === "user" && (
                  <div ref={spacerRef} />
                )}
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
                <InputGroupAddon align="block-end" className="justify-between">
                  {/* Model + thinking selectors — bottom left */}
                  <div className="flex items-center gap-1.5">
                    <Select
                      value={modelKey}
                      onValueChange={(v) => {
                        const k = v as ModelKey
                        setModelKey(k)
                        if (!MODELS[k].supportsThinking) setThinking("off")
                      }}
                      disabled={isStreaming}
                    >
                      <SelectTrigger className="h-7 w-auto gap-1.5 rounded-full border-0 bg-transparent px-2.5 text-xs shadow-none focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(MODELS) as ModelKey[]).map((key) => (
                          <SelectItem key={key} value={key}>
                            <span className="font-medium">{MODELS[key].label}</span>
                            <span className="text-muted-foreground ml-1.5">{MODELS[key].description}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedModel.supportsThinking && selectedModel.thinkingLevels && (
                      <Select
                        value={thinking}
                        onValueChange={(v) => setThinking(v as ThinkingLevel)}
                        disabled={isStreaming}
                      >
                        <SelectTrigger className="h-7 w-auto gap-1.5 rounded-full border-0 bg-transparent px-2.5 text-xs shadow-none focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedModel.thinkingLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {THINKING_LABELS[level]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Send button — bottom right */}
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
