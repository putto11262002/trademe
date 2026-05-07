import { useRef, useEffect, useLayoutEffect, useState, Suspense } from "react"
import { useMutation } from "@tanstack/react-query"
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
  generalChatModels,
  DEFAULT_GENERAL_CHAT_MODEL,
  type GeneralChatModel,
  type GeneralChatModelKey,
  type ProviderOptions,
} from "@/agent/general-chat-models"
import { useAuth } from "@clerk/tanstack-react-start"
import { ConversationSidebar, ConversationToggle } from "@/components/chat/thread-switcher"
import { createThreadFn, getThreadFn, updateThreadFn } from "@/thread/functions"
import type { Thread } from "@/thread/types"

const THREAD_LS_KEY = "activeThreadId"

// ---------------------------------------------------------------------------
// Markdown / message rendering
// ---------------------------------------------------------------------------

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
  return { isLoading, isDone, isError, label, loadingMsg, resultMsg, errorText: isError ? (p as { errorText?: string }).errorText : undefined }
}

function ToolGroup({ parts }: { parts: AnyPart[] }) {
  return (
    <div className="w-full overflow-hidden rounded-4xl border border-border">
      {parts.map((part, i) => {
        const { isLoading, isDone, isError, label, loadingMsg, resultMsg, errorText } = toolPartRow(part)
        return (
          <div key={i}>
            {i > 0 && <Separator />}
            <div className={cn("flex items-center gap-2.5 px-4 py-3 text-xs", isError ? "text-destructive" : "text-muted-foreground")}>
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
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2.5 px-4 py-3 transition-colors"
      >
        {isStreaming && !open ? <Loader2 className="size-3 shrink-0 animate-spin" /> : <Brain className="size-3 shrink-0" />}
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

function WorkingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <img src="/trademe-ai-logo.png" alt="" className="size-6 animate-bounce" />
      <span className="text-muted-foreground text-xs">Crunching numbers…</span>
    </div>
  )
}

function Message({ message, isStreaming }: { message: UIMessage; isStreaming: boolean }) {
  const isUser = message.role === "user"
  type Group = { kind: "text"; part: AnyPart; idx: number } | { kind: "reasoning"; part: AnyPart; idx: number } | { kind: "tools"; parts: AnyPart[] }
  const groups: Group[] = []
  for (const [idx, part] of message.parts.entries()) {
    const isTool = part.type.startsWith("tool-") || part.type === "dynamic-tool"
    if (isTool) {
      const last = groups[groups.length - 1]
      if (last?.kind === "tools") last.parts.push(part)
      else groups.push({ kind: "tools", parts: [part] })
    } else if (part.type === "reasoning") {
      groups.push({ kind: "reasoning", part, idx })
    } else {
      groups.push({ kind: "text", part, idx })
    }
  }
  return (
    <div className={cn("flex flex-col gap-5", isUser ? "items-end" : "items-start")}>
      {groups.map((group, gi) => {
        if (group.kind === "tools") return <ToolGroup key={gi} parts={group.parts} />
        if (group.kind === "reasoning") return <ReasoningPart key={gi} part={group.part} isStreaming={isStreaming} />
        if (group.part.type !== "text") return null
        if (isUser) {
          return (
            <div key={gi} className="bg-primary text-primary-foreground max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap">
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

// ---------------------------------------------------------------------------
// ContextRing — circular usage indicator with hover tooltip
// ---------------------------------------------------------------------------

function ContextRing({ pct, inputTokens, outputTokens, contextWindow }: {
  pct: number
  inputTokens: number
  outputTokens: number
  contextWindow: number
}) {
  const [open, setOpen] = useState(false)
  const r = 9
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  const color = pct >= 80 ? "text-destructive" : pct >= 60 ? "text-yellow-500" : "text-muted-foreground"
  const total = inputTokens + outputTokens

  return (
    <Popover open={open}>
      <PopoverTrigger asChild>
        <div
          className={cn("relative size-7 shrink-0 cursor-default", color)}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <svg className="size-full -rotate-90" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r={r} fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
            <circle cx="14" cy="14" r={r} fill="none" stroke="currentColor" strokeWidth="2"
              strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round" className="transition-all duration-500" />
          </svg>
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-48 p-3"
        onMouseLeave={() => setOpen(false)}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Input</span>
            <span>{inputTokens.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Output</span>
            <span>{outputTokens.toLocaleString()}</span>
          </div>
          <div className="border-t border-border pt-2">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Context used</span>
              <span className={cn("font-medium", pct >= 80 ? "text-destructive" : pct >= 60 ? "text-yellow-500" : "")}>{pct}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-border/40">
              <div
                className={cn("h-full rounded-full transition-all duration-500", pct >= 80 ? "bg-destructive" : pct >= 60 ? "bg-yellow-500" : "bg-primary/60")}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-1 text-right text-[10px] text-muted-foreground tabular-nums">
              {total.toLocaleString()} / {contextWindow.toLocaleString()}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// ConnectedChat — keyed by threadId so it fully remounts on thread switch
// ---------------------------------------------------------------------------

type ConnectedChatProps = {
  threadId: string
  modelKey: GeneralChatModelKey
  providerOptions: ProviderOptions
  activeTitle: string | null
  initialMessage?: string | null
  onInitialMessageSent?: () => void
  onClose: () => void
  onModelSelect: (key: GeneralChatModelKey) => void
  onThinkingSelect: (opts: ProviderOptions) => void
  onAutoTitle: (title: string) => void
}

function ConnectedChat({
  threadId, modelKey, providerOptions, activeTitle,
  initialMessage, onInitialMessageSent,
  onClose, onModelSelect, onThinkingSelect, onAutoTitle,
}: ConnectedChatProps) {
  const lastPairRef = useRef<HTMLDivElement>(null)
  const prevLastPairRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const floatingRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const justSubmittedRef = useRef(false)
  const hasInitialScrolledRef = useRef(false)
  const [input, setInput] = useState("")
  const [modelOpen, setModelOpen] = useState(false)
  const [contextUsage, setContextUsage] = useState<{ inputTokens: number; outputTokens: number } | null>(null)

  const agent = useAgent({ agent: "chat", name: threadId })
  const { messages, sendMessage, status, clearHistory } = useAgentChat({
    agent,
    body: () => ({ modelKey, providerOptions }),
    onData: (part) => {
      if ((part as { type: string }).type === "data-token-usage") {
        setContextUsage((part as { data: { inputTokens: number; outputTokens: number } }).data)
      }
    },
  })

  const isStreaming = status === "streaming" || status === "submitted"
  const selectedModel = generalChatModels[modelKey] as GeneralChatModel
  const contextPct = contextUsage
    ? Math.min(100, Math.round(((contextUsage.inputTokens + contextUsage.outputTokens) / selectedModel.contextWindow) * 100))
    : null
  const contextFull = contextPct !== null && contextPct >= 95
  const thinkingLevels = selectedModel.thinking?.levels ?? []
  const currentThinkingKey = thinkingLevels.find(
    (l) => JSON.stringify(l.providerOptions) === JSON.stringify(providerOptions)
  )?.key ?? null

  // Auto-title after first assistant reply
  useEffect(() => {
    if (activeTitle !== null) return
    const firstUser = messages.find((m) => m.role === "user")
    const hasAssistant = messages.some((m) => m.role === "assistant")
    if (!firstUser || !hasAssistant) return
    const textPart = firstUser.parts.find((p) => p.type === "text") as { text?: string } | undefined
    const title = textPart?.text?.slice(0, 60) ?? "New conversation"
    onAutoTitle(title)
  }, [messages, activeTitle, onAutoTitle])

  // Scroll to bottom on first load
  useEffect(() => {
    if (hasInitialScrolledRef.current || messages.length === 0) return
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
      hasInitialScrolledRef.current = true
    }
  }, [messages])

  // Send queued first message exactly once on mount (ref guards against Strict Mode double-invoke)
  const hasSentInitialRef = useRef(false)
  useEffect(() => {
    if (!initialMessage || hasSentInitialRef.current) return
    hasSentInitialRef.current = true
    sendMessage({ text: initialMessage })
    onInitialMessageSent?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refocus textarea when streaming ends
  useEffect(() => {
    if (!isStreaming) textareaRef.current?.focus()
  }, [isStreaming])

  // Keep paddingBottom in sync with floating input height
  useEffect(() => {
    const floating = floatingRef.current
    const scroll = scrollContainerRef.current
    if (!floating || !scroll) return
    const update = () => { scroll.style.paddingBottom = `${floating.offsetHeight + 16}px` }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(floating)
    return () => ro.disconnect()
  }, [])

  // Last pair minHeight so user message stays at scroll top
  useLayoutEffect(() => {
    if (!scrollContainerRef.current) return
    const container = scrollContainerRef.current
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
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit() }
  }

  return (
    <>
      {/* Messages */}
      <div ref={scrollContainerRef} className="h-full overflow-y-auto overscroll-none px-4 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
            <img src="/trademe-ai-logo.png" alt="" className="size-20" />
            <p className="text-muted-foreground text-base">How can I help?</p>
          </div>
        ) : (
          <div>
            {(() => {
              type Pair = { user: UIMessage; userIdx: number; assistant: UIMessage | null; assistantIdx: number | null }
              const leading: { msg: UIMessage; idx: number }[] = []
              const pairs: Pair[] = []
              let i = 0
              while (i < messages.length && messages[i].role === "assistant") leading.push({ msg: messages[i], idx: i++ })
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
                    <div key={msg.id}><Message message={msg} isStreaming={isStreaming && idx === messages.length - 1} /></div>
                  ))}
                  {pairs.map((pair, pi) => {
                    const isLast = pi === pairs.length - 1
                    return (
                      <div key={pair.user.id} ref={isLast ? lastPairRef : undefined} className="space-y-6 pt-6">
                        <div><Message message={pair.user} isStreaming={false} /></div>
                        {isLast && isStreaming && <WorkingIndicator />}
                        {pair.assistant && (
                          <div><Message message={pair.assistant} isStreaming={isStreaming && pair.assistantIdx === messages.length - 1} /></div>
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
        <div className="pointer-events-auto flex items-center justify-end gap-1">
          <ContextRing
            pct={contextPct ?? 0}
            inputTokens={contextUsage?.inputTokens ?? 0}
            outputTokens={contextUsage?.outputTokens ?? 0}
            contextWindow={selectedModel.contextWindow}
          />
          {messages.length > 0 && (
            <Button type="button" size="icon-sm" variant="ghost" onClick={clearHistory} disabled={isStreaming}
              className="size-7 rounded-full bg-background/80 backdrop-blur-sm shadow text-muted-foreground hover:text-destructive" aria-label="Clear history">
              <Trash2 className="size-3.5" />
            </Button>
          )}
          <Button type="button" size="icon-sm" variant="ghost" onClick={onClose}
            className="size-7 rounded-full bg-background/80 backdrop-blur-sm shadow text-muted-foreground hover:text-foreground" aria-label="Close chat">
            <X className="size-3.5" />
          </Button>
        </div>
        <div className="pointer-events-auto">
          <InputGroup className="border-primary bg-background/80 backdrop-blur-sm shadow-xl ring-1 ring-primary/30 has-[[data-slot=input-group-control]:focus-visible]:border-primary has-[[data-slot=input-group-control]:focus-visible]:ring-primary/30">
            <InputGroupTextarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your portfolio…"
              className="max-h-32 px-4 pt-4 text-sm"
              rows={2}
              disabled={isStreaming || contextFull}
            />
            <InputGroupAddon align="block-end" className="justify-between">
              <div className="flex items-center gap-1">
                <Popover open={modelOpen} onOpenChange={setModelOpen}>
                  <PopoverTrigger asChild>
                    <button type="button" disabled={isStreaming || contextFull}
                      className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50">
                      {selectedModel.label}
                      <ChevronDown className="size-3 opacity-60" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="start" className="w-48 p-1 gap-0">
                    {(Object.keys(generalChatModels) as GeneralChatModelKey[]).map((key) => (
                      <button type="button" key={key} onClick={() => { onModelSelect(key); setModelOpen(false) }}
                        className={cn("w-full rounded-2xl px-3 py-2 text-left text-xs transition-colors hover:bg-muted",
                          key === modelKey ? "text-foreground font-medium" : "text-muted-foreground")}>
                        {generalChatModels[key].label}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>

                {thinkingLevels.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" disabled={isStreaming}
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50">
                        Think: {thinkingLevels.find((l) => l.key === currentThinkingKey)?.label ?? "Off"}
                        <ChevronDown className="size-3 opacity-60" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="w-36 p-1 gap-0">
                      {thinkingLevels.map((level) => (
                        <button type="button" key={level.key} onClick={() => onThinkingSelect(level.providerOptions)}
                          className={cn("w-full rounded-2xl px-3 py-2 text-left text-xs transition-colors hover:bg-muted",
                            level.key === currentThinkingKey ? "text-foreground font-medium" : "text-muted-foreground")}>
                          {level.label}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <InputGroupButton size="icon-sm" variant="default" onClick={submit} disabled={isStreaming || !input.trim() || contextFull}>
                <ArrowUp />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// PreChatInput — shown when no thread exists yet; creates thread on first send
// ---------------------------------------------------------------------------

type PreChatInputProps = {
  modelKey: GeneralChatModelKey
  providerOptions: ProviderOptions
  isLoading: boolean
  onModelSelect: (key: GeneralChatModelKey) => void
  onThinkingSelect: (opts: ProviderOptions) => void
  onSubmit: (text: string) => void
  onClose: () => void
}

function PreChatInput({ modelKey, providerOptions, isLoading, onModelSelect, onThinkingSelect, onSubmit, onClose }: PreChatInputProps) {
  const [input, setInput] = useState("")
  const [modelOpen, setModelOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const floatingRef = useRef<HTMLDivElement>(null)

  const selectedModel = generalChatModels[modelKey] as GeneralChatModel
  const thinkingLevels = selectedModel.thinking?.levels ?? []
  const currentThinkingKey = thinkingLevels.find(
    (l) => JSON.stringify(l.providerOptions) === JSON.stringify(providerOptions)
  )?.key ?? null

  function submit() {
    const text = input.trim()
    if (!text || isLoading) return
    setInput("")
    onSubmit(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit() }
  }

  return (
    <>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center pointer-events-none">
        <img src="/trademe-ai-logo.png" alt="" className="size-20" />
        <p className="text-muted-foreground text-base">How can I help?</p>
      </div>

      <div ref={floatingRef} className="absolute bottom-4 left-4 right-4 pointer-events-none flex flex-col gap-1.5">
        <div className="pointer-events-auto flex items-center justify-end gap-1">
          <Button type="button" size="icon-sm" variant="ghost" onClick={onClose}
            className="size-7 rounded-full bg-background/80 backdrop-blur-sm shadow text-muted-foreground hover:text-foreground" aria-label="Close chat">
            <X className="size-3.5" />
          </Button>
        </div>
        <div className="pointer-events-auto">
          <InputGroup className="border-primary bg-background/80 backdrop-blur-sm shadow-xl ring-1 ring-primary/30 has-[[data-slot=input-group-control]:focus-visible]:border-primary has-[[data-slot=input-group-control]:focus-visible]:ring-primary/30">
            <InputGroupTextarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your portfolio…"
              className="max-h-32 px-4 pt-4 text-sm"
              rows={2}
              disabled={isLoading}
            />
            <InputGroupAddon align="block-end" className="justify-between">
              <div className="flex items-center gap-1">
                <Popover open={modelOpen} onOpenChange={setModelOpen}>
                  <PopoverTrigger asChild>
                    <button type="button" disabled={isLoading}
                      className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50">
                      {selectedModel.label}
                      <ChevronDown className="size-3 opacity-60" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="start" className="w-48 p-1 gap-0">
                    {(Object.keys(generalChatModels) as GeneralChatModelKey[]).map((key) => (
                      <button type="button" key={key} onClick={() => { onModelSelect(key); setModelOpen(false) }}
                        className={cn("w-full rounded-2xl px-3 py-2 text-left text-xs transition-colors hover:bg-muted",
                          key === modelKey ? "text-foreground font-medium" : "text-muted-foreground")}>
                        {generalChatModels[key].label}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>

                {thinkingLevels.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" disabled={isLoading}
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50">
                        Think: {thinkingLevels.find((l) => l.key === currentThinkingKey)?.label ?? "Off"}
                        <ChevronDown className="size-3 opacity-60" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="w-36 p-1 gap-0">
                      {thinkingLevels.map((level) => (
                        <button type="button" key={level.key} onClick={() => onThinkingSelect(level.providerOptions)}
                          className={cn("w-full rounded-2xl px-3 py-2 text-left text-xs transition-colors hover:bg-muted",
                            level.key === currentThinkingKey ? "text-foreground font-medium" : "text-muted-foreground")}>
                          {level.label}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <InputGroupButton size="icon-sm" variant="default" onClick={submit} disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="animate-spin" /> : <ArrowUp />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// ChatPanel — thread management shell
// ---------------------------------------------------------------------------

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const { userId } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [activeTitle, setActiveTitle] = useState<string | null>(null)
  const [modelKey, setModelKey] = useState<GeneralChatModelKey>(DEFAULT_GENERAL_CHAT_MODEL)
  const [providerOptions, setProviderOptions] = useState<ProviderOptions>({})
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: () => createThreadFn({ data: { userId: userId!, modelKey, providerOptions } }),
    onSuccess: (id) => {
      setActiveThreadId(id)
      setActiveTitle(null)
      localStorage.setItem(THREAD_LS_KEY, id)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (vars: Parameters<typeof updateThreadFn>[0]) => updateThreadFn(vars),
  })

  // Init — restore last thread if available, otherwise show empty (no server call)
  useEffect(() => {
    const stored = localStorage.getItem(THREAD_LS_KEY)
    if (stored) {
      getThreadFn({ data: { id: stored } })
        .then((t) => {
          if (t) {
            setActiveThreadId(t.id)
            setActiveTitle(t.title ?? null)
            setModelKey((t.modelKey as GeneralChatModelKey) ?? DEFAULT_GENERAL_CHAT_MODEL)
            setProviderOptions((t.providerOptions as ProviderOptions) ?? {})
            localStorage.setItem(THREAD_LS_KEY, t.id)
          } else {
            localStorage.removeItem(THREAD_LS_KEY)
          }
        })
        .catch(() => localStorage.removeItem(THREAD_LS_KEY))
        .finally(() => setInitialized(true))
    } else {
      setInitialized(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleThreadSelect(t: Thread) {
    setActiveThreadId(t.id)
    setActiveTitle(t.title ?? null)
    setModelKey((t.modelKey as GeneralChatModelKey) ?? DEFAULT_GENERAL_CHAT_MODEL)
    setProviderOptions((t.providerOptions as ProviderOptions) ?? {})
    setPendingMessage(null)
    localStorage.setItem(THREAD_LS_KEY, t.id)
  }

  function handleNewConversation() {
    setActiveThreadId(null)
    setActiveTitle(null)
    setModelKey(DEFAULT_GENERAL_CHAT_MODEL)
    setProviderOptions({})
    setPendingMessage(null)
    localStorage.removeItem(THREAD_LS_KEY)
  }

  function handleModelSelect(key: GeneralChatModelKey) {
    const defaultOpts = (generalChatModels[key] as GeneralChatModel).thinking?.default ?? {}
    setModelKey(key)
    setProviderOptions(defaultOpts)
    if (activeThreadId) {
      updateMutation.mutate({ data: { id: activeThreadId, modelKey: key, providerOptions: defaultOpts } })
    }
  }

  function handleThinkingSelect(opts: ProviderOptions) {
    setProviderOptions(opts)
    if (activeThreadId) {
      updateMutation.mutate({ data: { id: activeThreadId, providerOptions: opts } })
    }
  }

  function handleAutoTitle(title: string) {
    setActiveTitle(title)
    if (activeThreadId) {
      updateMutation.mutate({ data: { id: activeThreadId, title } })
    }
  }

  // Called from the pre-chat input — create thread then hand off the message
  function handleFirstMessage(text: string) {
    setPendingMessage(text)
    createMutation.mutate()
  }

  return (
    <div className="relative h-full">
      {/* Top-left toggle */}
      <div className="absolute top-4 left-4 z-10" onMouseEnter={() => setSidebarOpen(true)}>
        <ConversationToggle onClick={() => setSidebarOpen((o) => !o)} />
      </div>

      {/* Conversation sidebar */}
      <ConversationSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userId={userId ?? ""}
        activeThreadId={activeThreadId}
        onSelect={handleThreadSelect}
        onNew={handleNewConversation}
      />

      {initialized && !activeThreadId && (
        <PreChatInput
          modelKey={modelKey}
          providerOptions={providerOptions}
          isLoading={createMutation.isPending}
          onModelSelect={handleModelSelect}
          onThinkingSelect={handleThinkingSelect}
          onSubmit={handleFirstMessage}
          onClose={onClose}
        />
      )}

      {initialized && activeThreadId && (
        <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>}>
          <ConnectedChat
            key={activeThreadId}
            threadId={activeThreadId}
            modelKey={modelKey}
            providerOptions={providerOptions}
            activeTitle={activeTitle}
            initialMessage={pendingMessage}
            onInitialMessageSent={() => setPendingMessage(null)}
            onClose={onClose}
            onModelSelect={handleModelSelect}
            onThinkingSelect={handleThinkingSelect}
            onAutoTitle={handleAutoTitle}
          />
        </Suspense>
      )}
    </div>
  )
}
