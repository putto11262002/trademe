import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import {
  addTradeFn,
  addTradeSchema,
  type AddTradeFormValues,
  type AddTradeInput,
} from "@/trade"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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
import { cn } from "@/lib/utils"

export function TradeForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddTradeFormValues, unknown, AddTradeInput>({
    resolver: standardSchemaResolver(addTradeSchema),
    defaultValues: {
      side: "buy",
      fees: 0,
      tradedAt: new Date(),
    },
  })

  const mutation = useMutation({
    mutationFn: (data: AddTradeInput) => addTradeFn({ data }),
    onSuccess: () => {
      toast.success("Trade added")
      queryClient.invalidateQueries({ queryKey: ["trades"] })
      queryClient.invalidateQueries({ queryKey: ["positions"] })
      navigate({ to: "/trades" })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to add trade")
    },
  })

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className="space-y-6"
    >
      <FieldGroup>
        <Field data-invalid={!!errors.ticker}>
          <FieldLabel htmlFor="ticker">Ticker</FieldLabel>
          <Input
            id="ticker"
            placeholder="AAPL"
            autoComplete="off"
            aria-invalid={!!errors.ticker}
            {...register("ticker")}
          />
          <FieldError>{errors.ticker?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors.side}>
          <FieldLabel htmlFor="side">Side</FieldLabel>
          <Controller
            control={control}
            name="side"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="side">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldError>{errors.side?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors.quantity}>
          <FieldLabel htmlFor="quantity">Quantity</FieldLabel>
          <Input
            id="quantity"
            type="number"
            inputMode="decimal"
            step="0.00000001"
            placeholder="0"
            aria-invalid={!!errors.quantity}
            {...register("quantity")}
          />
          <FieldError>{errors.quantity?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors.pricePerShare}>
          <FieldLabel htmlFor="pricePerShare">Price per share (USD)</FieldLabel>
          <Input
            id="pricePerShare"
            type="number"
            inputMode="decimal"
            step="0.0001"
            placeholder="0.00"
            aria-invalid={!!errors.pricePerShare}
            {...register("pricePerShare")}
          />
          <FieldError>{errors.pricePerShare?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors.fees}>
          <FieldLabel htmlFor="fees">Fees (USD)</FieldLabel>
          <Input
            id="fees"
            type="number"
            inputMode="decimal"
            step="0.0001"
            defaultValue={0}
            aria-invalid={!!errors.fees}
            {...register("fees")}
          />
          <FieldDescription>Optional. Defaults to 0.</FieldDescription>
          <FieldError>{errors.fees?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors.fxRate}>
          <FieldLabel htmlFor="fxRate">FX rate (USD → THB)</FieldLabel>
          <Input
            id="fxRate"
            type="number"
            inputMode="decimal"
            step="0.000001"
            placeholder="36.50"
            aria-invalid={!!errors.fxRate}
            {...register("fxRate")}
          />
          <FieldDescription>Optional. Used for FX-decomposed P&L.</FieldDescription>
          <FieldError>{errors.fxRate?.message}</FieldError>
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
                        "justify-start text-left font-normal",
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
