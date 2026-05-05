import { Card, CardContent } from "@/components/ui/card"

/**
 * TradingView "advanced chart" iframe embed — no API key required.
 * Docs: https://www.tradingview.com/widget/advanced-chart/
 */
export function TradingViewChart({ ticker }: { ticker: string }) {
  const symbol = encodeURIComponent(ticker.toUpperCase())
  const src =
    `https://s.tradingview.com/widgetembed/?frameElementId=tradingview-${symbol}` +
    `&symbol=${symbol}&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=0` +
    `&toolbarbg=f1f3f6&studies=[]&theme=light&style=1&timezone=Etc/UTC&withdateranges=1` +
    `&hideideas=1&locale=en`
  return (
    <Card size="sm" className="overflow-hidden p-0">
      <CardContent className="p-0">
        <iframe
          title={`${ticker} chart`}
          src={src}
          className="h-[420px] w-full border-0"
          allowTransparency
          // eslint-disable-next-line react/no-unknown-property
          scrolling="no"
        />
      </CardContent>
    </Card>
  )
}
