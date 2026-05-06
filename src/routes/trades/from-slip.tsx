import { useMutation } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft, FileText, ImageIcon, Loader2, Upload } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { TradeForm } from "@/components/trade/trade-form"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { parseSlipFn, type SlipExtractionSlip } from "@/slip"
import type { AddTradeFormValues } from "@/trade"

export const Route = createFileRoute("/trades/from-slip")({
  component: FromSlipPage,
})

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
const MAX_RAW_BYTES = 7 * 1024 * 1024

type Phase =
  | { kind: "idle" }
  | { kind: "parsing"; previewUrl: string }
  | {
      kind: "parsed"
      previewUrl: string
      slipId: string
      values: Partial<AddTradeFormValues>
    }

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"))
    reader.readAsDataURL(file)
  })
}

const CORE_FIELDS = ["ticker", "side", "quantity", "pricePerShare"] as const

function missingCoreFields(extraction: SlipExtractionSlip): string[] {
  return CORE_FIELDS.filter((f) => extraction[f] == null)
}

function extractionToFormValues(
  extraction: SlipExtractionSlip,
): Partial<AddTradeFormValues> {
  const parsedDate = extraction.tradedAt ? new Date(extraction.tradedAt) : null
  const tradedAt =
    parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : new Date()
  return {
    ticker: extraction.ticker ?? undefined,
    side: extraction.side ?? undefined,
    quantity: extraction.quantity ?? undefined,
    pricePerShare: extraction.pricePerShare ?? undefined,
    fees: extraction.fees ?? 0,
    fxRate: extraction.fxRate ?? undefined,
    tradedAt,
    broker: extraction.broker ?? undefined,
  }
}

function FromSlipPage() {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" })
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  useEffect(() => {
    return () => {
      const p = phaseRef.current
      if (p.kind !== "idle") URL.revokeObjectURL(p.previewUrl)
    }
  }, [])

  const mutation = useMutation({
    mutationFn: async (input: { file: File; previewUrl: string }) => {
      const dataUrl = await fileToBase64(input.file)
      const result = await parseSlipFn({
        data: { imageBase64: dataUrl, contentType: input.file.type },
      })
      return { result, previewUrl: input.previewUrl }
    },
    onSuccess: ({ result, previewUrl }) => {
      if (result.kind === "slip") {
        const missing = missingCoreFields(result.extraction)
        if (missing.length > 0) {
          toast.warning(
            `Slip parsed — please complete: ${missing.join(", ")}`,
          )
        } else {
          toast.success("Slip parsed — fields autofilled")
        }
        setPhase({
          kind: "parsed",
          previewUrl,
          slipId: result.slipId,
          values: extractionToFormValues(result.extraction),
        })
      } else {
        toast.error(`Not a trade slip: ${result.reason}`)
        URL.revokeObjectURL(previewUrl)
        setPhase({ kind: "idle" })
      }
    },
    onError: (error, variables) => {
      toast.error(error instanceof Error ? error.message : "Failed to parse slip")
      URL.revokeObjectURL(variables.previewUrl)
      setPhase({ kind: "idle" })
    },
  })

  const handlePick = (file: File | undefined) => {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Unsupported image type. Use PNG, JPEG, or WebP.")
      return
    }
    if (file.size > MAX_RAW_BYTES) {
      toast.error(
        `Image too large (${(file.size / 1_000_000).toFixed(1)} MB). Max 7 MB.`,
      )
      return
    }
    const previewUrl = URL.createObjectURL(file)
    setPhase({ kind: "parsing", previewUrl })
    mutation.mutate({ file, previewUrl })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/trades">
          <ArrowLeft className="size-4" />
          Back to trades
        </Link>
      </Button>

      {phase.kind === "idle" ? (
        <CenteredUploader onPick={handlePick} />
      ) : phase.kind === "parsing" ? (
        <ParsingOverlay previewUrl={phase.previewUrl} />
      ) : (
        <ParsedSplit
          previewUrl={phase.previewUrl}
          slipId={phase.slipId}
          values={phase.values}
        />
      )}
    </div>
  )
}

function CenteredUploader({ onPick }: { onPick: (f: File | undefined) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Upload a trade slip</h1>
        <p className="text-muted-foreground text-sm">
          Snap or upload your broker's confirmation. We'll autofill the trade
          form for you to review.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          onPick(e.dataTransfer.files?.[0])
        }}
        data-drag={dragOver}
        className="bg-muted/30 hover:bg-muted/50 data-[drag=true]:border-ring data-[drag=true]:bg-muted/60 flex w-full flex-col items-center gap-3 rounded-3xl border border-dashed p-12 text-center transition-colors"
      >
        <div className="bg-background flex size-12 items-center justify-center rounded-full border">
          <Upload className="size-5" />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium">Drop a slip image here</div>
          <div className="text-muted-foreground text-xs">
            or click to browse · PNG, JPEG, WebP · up to 7 MB
          </div>
        </div>
      </button>
    </div>
  )
}

function ParsingOverlay({ previewUrl }: { previewUrl: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/95 p-6 backdrop-blur-sm">
      <img
        src={previewUrl}
        alt="Slip being parsed"
        className="max-h-64 max-w-xs rounded-2xl border object-contain shadow-sm"
      />
      <div className="flex items-center gap-2 text-sm font-medium">
        <Loader2 className="size-4 animate-spin" />
        Parsing slip…
      </div>
      <div className="text-muted-foreground max-w-sm text-center text-xs">
        Reading ticker, side, quantity, price, and date. This usually takes a
        few seconds.
      </div>
    </div>
  )
}

function ParsedSplit({
  previewUrl,
  slipId,
  values,
}: {
  previewUrl: string
  slipId: string
  values: Partial<AddTradeFormValues>
}) {
  const defaults = { ...values, slipId }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Review trade</h1>
        <p className="text-muted-foreground text-sm">
          We autofilled from your slip. Double-check before saving.
        </p>
      </header>

      <Tabs defaultValue="form">
        <TabsList className="mb-4 w-full lg:hidden">
          <TabsTrigger value="form" className="flex-1">
            <FileText className="size-4" />
            Form
          </TabsTrigger>
          <TabsTrigger value="slip" className="flex-1">
            <ImageIcon className="size-4" />
            Slip
          </TabsTrigger>
        </TabsList>
        <div className="lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-8">
          <TabsContent
            value="form"
            forceMount
            className="data-[state=inactive]:hidden lg:!block"
          >
            <TradeForm key={slipId} defaultValues={defaults} />
          </TabsContent>
          <TabsContent
            value="slip"
            forceMount
            className="data-[state=inactive]:hidden lg:!flex lg:items-center lg:justify-center"
          >
            <AspectRatio ratio={3 / 4} className="mx-auto w-full max-w-sm">
              <img
                src={previewUrl}
                alt="Uploaded slip"
                className="size-full object-contain"
              />
            </AspectRatio>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
