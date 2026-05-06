import { useRef, useEffect, useLayoutEffect, useState } from "react"
import { useAgent } from "agents/react"
import { useAgentChat } from "agents/ai-react"
import type { UIMessage, UIDataTypes, UITools } from "ai"
import { AlertCircle, ArrowUp, Brain, CheckCircle2, ChevronDown, Loader2, Trash2, X } from "lucide-react"
import { Streamdown, type Components } from "streamdown"
import { Button } from "@/components/ui/button"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
          <div key={gi} className="prose prose-sm dark:prose-invert w-full text-sm">
            <Streamdown isAnimating={isStreaming} components={markdownComponents}>{group.part.text}</Streamdown>
          </div>
        )
      })}
    </div>
  )
}

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const lastPairRef = useRef<HTMLDivElement>(null)
  const prevLastPairRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const floatingRef = useRef<HTMLDivElement>(null)
  const justSubmittedRef = useRef(false)
  const hasInitialScrolledRef = useRef(false)
  const [input, setInput] = useState("")
  const [modelKey, setModelKey] = useState<ModelKey>(DEFAULT_MODEL)
  const [thinking, setThinking] = useState<ThinkingLevel>(DEFAULT_THINKING)
  const [modelOpen, setModelOpen] = useState(false)

  const agent = useAgent({ agent: "chat", name: MOCK_USER_ID })
  const { messages, sendMessage, status, clearHistory } = useAgentChat({
    agent,
    body: () => ({ model: modelKey, thinking }),
  })

  const isStreaming = status === "streaming" || status === "submitted"
  const selectedModel = MODELS[modelKey]

  // On mount: scroll to bottom once
  useEffect(() => {
    if (hasInitialScrolledRef.current || messages.length === 0) return
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
      hasInitialScrolledRef.current = true
    }
  }, [messages])

  // Keep scroll container paddingBottom in sync with the floating input height so the
  // minHeight calc (which reads paddingBottom via getComputedStyle) stays accurate automatically.
  useEffect(() => {
    const floating = floatingRef.current
    const scroll = scrollContainerRef.current
    if (!floating || !scroll) return
    const update = () => {
      scroll.style.paddingBottom = `${floating.offsetHeight + 16}px` // +16 = bottom-4 gap
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(floating)
    return () => ro.disconnect()
  }, [])

  // The last user+assistant pair gets minHeight = containerH - paddingBottom so the pair fills
  // the visible area. This means scrollTop = pairTop is always the scroll maximum — the user
  // literally cannot scroll past the user message.
  useLayoutEffect(() => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current

    // Clear previous last pair's minHeight when a new pair takes over
    if (prevLastPairRef.current && prevLastPairRef.current !== lastPairRef.current) {
      prevLastPairRef.current.style.minHeight = ""
    }

    if (lastPairRef.current) {
      const paddingBottom = parseFloat(window.getComputedStyle(container).paddingBottom)
      lastPairRef.current.style.minHeight = `${container.clientHeight - paddingBottom}px`
      prevLastPairRef.current = lastPairRef.current
    }

    if (justSubmittedRef.current) {
      justSubmittedRef.current = false
      if (lastPairRef.current) {
        const el = lastPairRef.current
        const elTop = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop
        container.scrollTop = elTop
      }
    }
  }, [messages])

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
    <div className="relative h-full">
      {/* Messages */}
      <div ref={scrollContainerRef} className="h-full overflow-y-auto overscroll-none px-4 pt-4">
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-center text-sm mt-8">
            Ask me about your portfolio, a stock price, or recent news.
          </p>
        ) : (
          <div>
            {(() => {
              // Group into pairs: leading assistant messages (e.g. initial greeting) render as-is;
              // each user message + optional following assistant forms a "pair" container.
              type Pair = { user: UIMessage; userIdx: number; assistant: UIMessage | null; assistantIdx: number | null }
              const leading: { msg: UIMessage; idx: number }[] = []
              const pairs: Pair[] = []
              let i = 0
              while (i < messages.length && messages[i].role === "assistant") {
                leading.push({ msg: messages[i], idx: i++ })
              }
              while (i < messages.length) {
                if (messages[i].role === "user") {
                  const user = messages[i]; const userIdx = i++
                  const hasAssistant = i < messages.length && messages[i].role === "assistant"
                  const assistant = hasAssistant ? messages[i] : null
                  const assistantIdx = hasAssistant ? i++ : null
                  pairs.push({ user, userIdx, assistant, assistantIdx })
                } else { i++ }
              }
              return (
                <>
                  {leading.map(({ msg, idx }) => (
                    <div key={msg.id}>
                      <Message message={msg} isStreaming={isStreaming && idx === messages.length - 1} />
                    </div>
                  ))}
                  {pairs.map((pair, pi) => {
                    const isLast = pi === pairs.length - 1
                    return (
                      <div key={pair.user.id} ref={isLast ? lastPairRef : undefined} className="space-y-6 pt-6">
                        <div>
                          <Message message={pair.user} isStreaming={false} />
                        </div>
                        {pair.assistant && (
                          <div>
                            <Message
                              message={pair.assistant}
                              isStreaming={isStreaming && pair.assistantIdx === messages.length - 1}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </>
              )
            })()}
          </div>
        )}
      </div>

      {/* Floating input */}
      <div ref={floatingRef} className="absolute bottom-4 left-4 right-4 pointer-events-none flex flex-col gap-1.5">
        {/* Action row */}
        <div className="pointer-events-auto flex items-center justify-end gap-1">
          {messages.length > 0 && (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={clearHistory}
              disabled={isStreaming}
              className="size-7 rounded-full bg-background/80 backdrop-blur-sm shadow text-muted-foreground hover:text-destructive"
              aria-label="Clear history"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onClose}
            className="size-7 rounded-full bg-background/80 backdrop-blur-sm shadow text-muted-foreground hover:text-foreground"
            aria-label="Close chat"
          >
            <X className="size-3.5" />
          </Button>
        </div>
        <div className="pointer-events-auto">
          <InputGroup className="border-primary bg-background/80 backdrop-blur-sm shadow-xl ring-1 ring-primary/30 has-[[data-slot=input-group-control]:focus-visible]:border-primary has-[[data-slot=input-group-control]:focus-visible]:ring-primary/30">
            <InputGroupTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your portfolio…"
              className="max-h-32 px-4 pt-4 text-sm"
              rows={2}
              disabled={isStreaming}
            />
            <InputGroupAddon align="block-end" className="justify-between">
              <div className="flex items-center gap-1">
                <Popover open={modelOpen} onOpenChange={setModelOpen}>
                  <PopoverTrigger asChild>
                    <button
                      disabled={isStreaming}
                      className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      {selectedModel.label}
                      <ChevronDown className="size-3 opacity-60" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="start" className="w-48 p-1 gap-0">
                    {(Object.keys(MODELS) as ModelKey[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          setModelKey(key)
                          if (!MODELS[key].supportsThinking) setThinking("off")
                          setModelOpen(false)
                        }}
                        className={cn(
                          "w-full rounded-2xl px-3 py-2 text-left text-xs transition-colors hover:bg-muted",
                          key === modelKey ? "text-foreground font-medium" : "text-muted-foreground",
                        )}
                      >
                        {MODELS[key].label}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>

                {selectedModel.supportsThinking && selectedModel.thinkingLevels && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        disabled={isStreaming}
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                      >
                        Think: {THINKING_LABELS[thinking]}
                        <ChevronDown className="size-3 opacity-60" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="w-36 p-1 gap-0">
                      {selectedModel.thinkingLevels.map((level) => (
                        <button
                          key={level}
                          onClick={() => setThinking(level)}
                          className={cn(
                            "w-full rounded-2xl px-3 py-2 text-left text-xs transition-colors hover:bg-muted",
                            level === thinking ? "text-foreground font-medium" : "text-muted-foreground",
                          )}
                        >
                          {THINKING_LABELS[level]}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                )}
              </div>

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
  )
}

