import { useMutation } from "@tanstack/react-query"
import { Loader2, Sparkles, Upload, X } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { parseSlipFn, type SlipExtractionTrade } from "@/slip"
import { Button } from "@/components/ui/button"

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
const MAX_RAW_BYTES = 7 * 1024 * 1024

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"))
    reader.readAsDataURL(file)
  })
}

export function SlipUploader({
  onParsed,
}: {
  onParsed: (extraction: SlipExtractionTrade, slipId: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const dataUrl = await fileToBase64(file)
      return parseSlipFn({
        data: { imageBase64: dataUrl, contentType: file.type },
      })
    },
    onSuccess: (result) => {
      if (result.kind === "trade") {
        toast.success("Slip parsed — fields autofilled")
        onParsed(result.extraction, result.slipId)
      } else {
        toast.error(`Not a trade slip: ${result.reason}`)
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to parse slip")
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
    const url = URL.createObjectURL(file)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
    setFileName(file.name)
    mutation.mutate(file)
  }

  const reset = () => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setFileName(null)
    if (inputRef.current) inputRef.current.value = ""
    mutation.reset()
  }

  return (
    <div className="rounded-3xl border border-dashed bg-muted/30 p-4">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handlePick(e.target.files?.[0])}
      />
      {previewUrl ? (
        <div className="flex items-start gap-3">
          <img
            src={previewUrl}
            alt="Slip preview"
            className="h-32 w-24 shrink-0 rounded-2xl border bg-background object-cover"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Parsing slip…
                </>
              ) : mutation.data?.kind === "trade" ? (
                <>
                  <Sparkles className="size-4 text-green-600" />
                  Autofilled from slip
                </>
              ) : mutation.data?.kind === "not_a_slip" ? (
                <span className="text-destructive">
                  Not a trade slip — fill the form manually
                </span>
              ) : (
                <span className="text-muted-foreground">Slip uploaded</span>
              )}
            </div>
            {fileName ? (
              <div className="text-muted-foreground truncate text-xs">
                {fileName}
              </div>
            ) : null}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                disabled={mutation.isPending}
              >
                Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={reset}
                disabled={mutation.isPending}
              >
                <X className="size-4" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 py-6 text-center"
        >
          <div className="bg-background flex size-10 items-center justify-center rounded-full border">
            <Upload className="size-4" />
          </div>
          <div className="space-y-0.5">
            <div className="text-sm font-medium">Upload a trade slip</div>
            <div className="text-muted-foreground text-xs">
              PNG, JPEG, or WebP · up to 7 MB · we'll autofill the form
            </div>
          </div>
        </button>
      )}
    </div>
  )
}
