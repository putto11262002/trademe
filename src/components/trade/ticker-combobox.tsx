import { useInfiniteQuery } from "@tanstack/react-query"
import { ChevronsUpDownIcon, Loader2Icon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { logoUrl, searchCompanyProfilesFn } from "@/market"
import type { CompanyProfile } from "@/market"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type Props = {
  id?: string
  value: string
  onChange: (ticker: string) => void
  onBlur?: () => void
  "aria-invalid"?: boolean
  placeholder?: string
}

const PAGE_SIZE = 20

export function TickerCombobox({
  id,
  value,
  onChange,
  onBlur,
  placeholder = "Search ticker or name…",
  ...rest
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [selected, setSelected] = useState<CompanyProfile | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 150)
    return () => clearTimeout(t)
  }, [query])

  const { data, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["ticker-search", debounced],
      queryFn: ({ pageParam }) =>
        searchCompanyProfilesFn({
          data: { query: debounced, limit: PAGE_SIZE, offset: pageParam },
        }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE,
      enabled: open,
      staleTime: 60_000,
    })

  const results = data?.pages.flat() ?? []

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !open || !hasNextPage) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { root: el.closest("[data-slot=command-list]"), rootMargin: "80px" },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [open, hasNextPage, isFetchingNextPage, fetchNextPage])

  const triggerSrc = selected ? logoUrl(selected, { size: 48 }) : undefined

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) {
          setQuery("")
          onBlur?.()
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={rest["aria-invalid"]}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
          )}
        >
          {value && selected?.ticker === value ? (
            <span className="flex min-w-0 items-center gap-2">
              <Avatar size="sm" className="rounded-md">
                {triggerSrc ? (
                  <AvatarImage
                    src={triggerSrc}
                    alt=""
                    className="object-contain"
                  />
                ) : null}
                <AvatarFallback className="rounded-md text-[10px]">
                  {value.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="font-mono">{value}</span>
              <span className="text-muted-foreground truncate text-xs">
                {selected.name}
              </span>
            </span>
          ) : (
            <span className="truncate">{value || placeholder}</span>
          )}
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {isFetching && results.length === 0 ? (
              <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
                <Loader2Icon className="size-4 animate-spin" />
                Searching…
              </div>
            ) : null}
            {!isFetching && results.length === 0 ? (
              <CommandEmpty>No matches</CommandEmpty>
            ) : null}
            {results.length > 0 ? (
              <CommandGroup heading={debounced ? "Matches" : "All tickers"}>
                {results.map((p) => {
                  const src = logoUrl(p, { size: 48 })
                  return (
                    <CommandItem
                      key={p.ticker}
                      value={p.ticker}
                      onSelect={() => {
                        onChange(p.ticker)
                        setSelected(p)
                        setOpen(false)
                      }}
                    >
                      <Avatar size="sm" className="rounded-md">
                        {src ? (
                          <AvatarImage
                            src={src}
                            alt=""
                            className="object-contain"
                          />
                        ) : null}
                        <AvatarFallback className="rounded-md text-[10px]">
                          {p.ticker.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-mono text-sm">{p.ticker}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {p.name}
                      </span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ) : null}
            {hasNextPage ? (
              <div
                ref={sentinelRef}
                className="text-muted-foreground flex items-center justify-center gap-2 py-3 text-xs"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2Icon className="size-3 animate-spin" />
                    Loading more…
                  </>
                ) : (
                  <span className="opacity-0">.</span>
                )}
              </div>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
