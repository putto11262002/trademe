import { createOpenAI } from "@ai-sdk/openai"
import { env } from "cloudflare:workers"
import type { ThinkingLevel } from "@/agent/models"

export function createModel(modelId: string, _thinking?: ThinkingLevel) {
  const gateway = createOpenAI({
    baseURL: "https://ai-gateway.vercel.sh/v1",
    apiKey: env.VERCEL_AI_GATEWAY_KEY,
  })
  const model = gateway.chat(modelId)
  return model
}
