import type { OnFinishEvent, ToolSet } from "ai"
import { getDb } from "@/db/index.server"
import { aiRun } from "@/db/schema"
import { computeCostUsd } from "./pricing"
import type { AiRunType } from "./schemas"
import type { NewAiRun } from "./types"

export async function insertAiRun(data: NewAiRun): Promise<void> {
  const db = getDb()
  await db.insert(aiRun).values(data)
}

export function buildAiRun({
  event,
  userId,
  threadId,
  type,
  startedAt,
}: {
  event: OnFinishEvent<ToolSet>
  userId: string
  threadId: string | null
  type: AiRunType
  startedAt: number
}): NewAiRun {
  const usage = event.totalUsage
  const inputDetails = usage.inputTokenDetails ?? {}
  const outputDetails = usage.outputTokenDetails ?? {}

  const noCacheTokens = inputDetails.noCacheTokens ?? (usage.inputTokens ?? 0)
  const cacheReadTokens = inputDetails.cacheReadTokens ?? 0
  const cacheWriteTokens = inputDetails.cacheWriteTokens ?? 0
  const outputTokens = usage.outputTokens ?? 0
  const reasoningTokens = outputDetails.reasoningTokens ?? 0

  const modelId = event.model?.modelId ?? "unknown"

  const toolsUsed = Array.from(
    new Set(
      event.steps.flatMap((step) =>
        step.toolCalls.map((tc) => tc.toolName),
      ),
    ),
  )

  return {
    id: crypto.randomUUID(),
    userId,
    threadId,
    type,
    model: modelId,
    stepCount: event.steps.length,
    inputTokens: usage.inputTokens ?? 0,
    cacheReadTokens,
    cacheWriteTokens,
    outputTokens,
    reasoningTokens,
    costUsd: String(
      computeCostUsd(modelId, { noCacheTokens, cacheReadTokens, cacheWriteTokens, outputTokens }),
    ),
    durationMs: Date.now() - startedAt,
    finishReason: event.finishReason ?? "unknown",
    toolsUsed,
    meta: {},
  }
}
