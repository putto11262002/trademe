import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { AiRunRow } from "@/agent/usage/api.server"

function modelLabel(modelId: string) {
  if (modelId.includes("flash")) return "Flash"
  if (modelId.includes("pro")) return "Pro"
  return modelId
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function RecentRuns({ runs }: { runs: AiRunRow[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Recent runs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No runs yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Steps</TableHead>
                <TableHead>Tools</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDate(run.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs">{modelLabel(run.model)}</TableCell>
                  <TableCell className="text-xs">{run.stepCount}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {run.toolsUsed.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        run.toolsUsed.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {t}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(run.inputTokens + run.outputTokens).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    ${Number(run.costUsd).toFixed(4)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
