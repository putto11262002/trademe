import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { format } from "date-fns"
import {
  CalendarIcon,
  MinusIcon,
  PlusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"
import { useState } from "react"
import { Controller, useForm, useWatch, type Control } from "react-hook-form"
import { toast } from "sonner"
import {
  addTradeFn,
  addTradeSchema,
  type AddTradeFormValues,
  type AddTradeInput,
} from "@/trade"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TickerCombobox } from "@/components/trade/ticker-combobox"
import { BROKERS } from "@/trade/brokers"
import { cn } from "@/lib/utils"

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

type NumberFieldName = "quantity" | "pricePerShare" | "fees"

function toNum(v: unknown): number {
  if (typeof v === "number") return v
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v)
    return Number.isFinite(n) ? n : NaN
  }
  return NaN
}

function NumberStepper({
  id,
  value,
  onChange,
  onBlur,
  step,
  min = 0,
  precision,
  rightAddon,
  placeholder,
  invalid,
}: {
  id?: string
  value: unknown
  onChange: (v: string) => void
  onBlur?: () => void
  step: number
  min?: number
  precision?: number
  rightAddon?: string
  placeholder?: string
  invalid?: boolean
}) {
  const adjust = (delta: number) => {
    const cur = toNum(value)
    const base = Number.isFinite(cur) ? cur : 0
    const next = Math.max(min, base + delta)
    onChange(precision != null ? next.toFixed(precision) : String(next))
  }
  const inputValue =
    value === undefined || value === null
      ? ""
      : typeof value === "number"
        ? String(value)
        : (value as string)

  return (
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <InputGroupButton
          size="icon-xs"
          aria-label="Decrease"
          onClick={() => adjust(-step)}
        >
          <MinusIcon />
        </InputGroupButton>
      </InputGroupAddon>
      <InputGroupInput
        id={id}
        type="number"
        inputMode="decimal"
        step={step}
        placeholder={placeholder}
        aria-invalid={invalid}
        className="text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {rightAddon ? (
        <InputGroupAddon align="inline-end">
          <InputGroupText>{rightAddon}</InputGroupText>
        </InputGroupAddon>
      ) : null}
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label="Increase"
          onClick={() => adjust(step)}
        >
          <PlusIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

function LiveTotal({ control }: { control: Control<AddTradeFormValues> }) {
  const [qtyRaw, priceRaw, feesRaw, side] = useWatch({
    control,
    name: ["quantity", "pricePerShare", "fees", "side"],
  })
  const qty = toNum(qtyRaw)
  const price = toNum(priceRaw)
  const fees = toNum(feesRaw)

  if (!Number.isFinite(qty) || !Number.isFinite(price) || qty <= 0 || price <= 0) {
    return (
      <div className="text-muted-foreground rounded-3xl border border-dashed px-4 py-3 text-sm">
        Enter quantity and price to see total
      </div>
    )
  }

  const gross = qty * price
  const safeFees = Number.isFinite(fees) ? fees : 0
  const totalUSD = side === "buy" ? gross + safeFees : gross - safeFees
  const verb = side === "buy" ? "You'll pay" : "You'll receive"

  return (
    <div className="bg-muted/40 rounded-3xl border px-4 py-3 text-sm">
      <div className="text-muted-foreground text-xs">{verb}</div>
      <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
        <span className="text-xl font-semibold tabular-nums">
          {usd.format(totalUSD)}
        </span>
      </div>
      <div className="text-muted-foreground mt-1 text-xs tabular-nums">
        {qty} sh × {usd.format(price)}
        {safeFees > 0
          ? ` ${side === "buy" ? "+" : "−"} ${usd.format(safeFees)} fees`
          : ""}
      </div>
    </div>
  )
}

const NUMBER_FIELDS: Record<
  NumberFieldName,
  { step: number; precision?: number; rightAddon?: string; placeholder: string }
> = {
  quantity: { step: 1, rightAddon: "sh", placeholder: "0" },
  pricePerShare: { step: 0.01, precision: 2, rightAddon: "USD", placeholder: "0.00" },
  fees: { step: 1, precision: 2, rightAddon: "USD", placeholder: "0.00" },
}

export function TradeForm({
  defaultValues,
}: {
  defaultValues?: Partial<AddTradeFormValues>
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddTradeFormValues, unknown, AddTradeInput>({
    resolver: standardSchemaResolver(addTradeSchema),
    defaultValues: {
      side: "buy",
      fees: 0,
      tradedAt: new Date(),
      ...defaultValues,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: AddTradeInput) => addTradeFn({ data }),
    onSuccess: () => {
      setSubmitError(null)
      toast.success("Trade added")
      queryClient.invalidateQueries({ queryKey: ["trades"] })
      queryClient.invalidateQueries({ queryKey: ["positions"] })
      queryClient.invalidateQueries({ queryKey: ["portfolio"] })
      navigate({ to: "/trades" })
    },
    onError: (error) => {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to add trade",
      )
    },
  })

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className="space-y-6"
    >
      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      <FieldGroup>
        <Field data-invalid={!!errors.ticker}>
          <FieldLabel htmlFor="ticker">Ticker</FieldLabel>
          <Controller
            control={control}
            name="ticker"
            render={({ field }) => (
              <TickerCombobox
                id="ticker"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                aria-invalid={!!errors.ticker}
              />
            )}
          />
          <FieldError>{errors.ticker?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors.side}>
          <FieldLabel>Side</FieldLabel>
          <Controller
            control={control}
            name="side"
            render={({ field }) => (
              <ToggleGroup
                type="single"
                variant="outline"
                size="lg"
                spacing={0}
                value={field.value}
                onValueChange={(v) => v && field.onChange(v)}
                className="w-full"
              >
                <ToggleGroupItem
                  value="buy"
                  aria-label="Buy"
                  className="flex-1 data-[state=on]:border-green-600 data-[state=on]:bg-green-600 data-[state=on]:text-white data-[state=on]:hover:bg-green-600/90"
                >
                  <TrendingUpIcon />
                  Buy
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="sell"
                  aria-label="Sell"
                  className="flex-1 data-[state=on]:border-destructive data-[state=on]:bg-destructive data-[state=on]:text-white data-[state=on]:hover:bg-destructive/90"
                >
                  <TrendingDownIcon />
                  Sell
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          />
          <FieldError>{errors.side?.message}</FieldError>
        </Field>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field data-invalid={!!errors.quantity}>
            <FieldLabel htmlFor="quantity">Quantity</FieldLabel>
            <Controller
              control={control}
              name="quantity"
              render={({ field }) => (
                <NumberStepper
                  id="quantity"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.quantity}
                  {...NUMBER_FIELDS.quantity}
                />
              )}
            />
            <FieldError>{errors.quantity?.message}</FieldError>
          </Field>

          <Field data-invalid={!!errors.pricePerShare}>
            <FieldLabel htmlFor="pricePerShare">Price per share</FieldLabel>
            <Controller
              control={control}
              name="pricePerShare"
              render={({ field }) => (
                <NumberStepper
                  id="pricePerShare"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.pricePerShare}
                  {...NUMBER_FIELDS.pricePerShare}
                />
              )}
            />
            <FieldError>{errors.pricePerShare?.message}</FieldError>
          </Field>
        </div>

        <Field data-invalid={!!errors.fees}>
          <FieldLabel htmlFor="fees">Fees</FieldLabel>
          <Controller
            control={control}
            name="fees"
            render={({ field }) => (
              <NumberStepper
                id="fees"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={!!errors.fees}
                {...NUMBER_FIELDS.fees}
              />
            )}
          />
          <FieldDescription>Optional. Defaults to 0.</FieldDescription>
          <FieldError>{errors.fees?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors.broker}>
          <FieldLabel htmlFor="broker">Broker</FieldLabel>
          <Controller
            control={control}
            name="broker"
            render={({ field }) => (
              <Select
                value={(field.value as string | undefined) ?? ""}
                onValueChange={(v) => field.onChange(v === "" ? undefined : v)}
              >
                <SelectTrigger id="broker" className="w-full">
                  <SelectValue placeholder="Select broker (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {BROKERS.map((b) => (
                    <SelectItem key={b.slug} value={b.slug}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldDescription>Optional. Where you placed the trade.</FieldDescription>
          <FieldError>{errors.broker?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors.tradedAt}>
          <FieldLabel>Trade date</FieldLabel>
          <Controller
            control={control}
            name="tradedAt"
            render={({ field }) => {
              const value = field.value as Date | undefined
              return (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {value ? format(value, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={value}
                      onSelect={(d) => d && field.onChange(d)}
                      disabled={(d) => d > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              )
            }}
          />
          <FieldError>{errors.tradedAt?.message}</FieldError>
        </Field>

        <LiveTotal control={control} />
      </FieldGroup>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Adding…" : "Add trade"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate({ to: "/trades" })}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
