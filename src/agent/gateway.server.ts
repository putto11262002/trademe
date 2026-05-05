import { createOpenAI } from "@ai-sdk/openai"
import { env } from "cloudflare:workers"

export function createModel(modelId: string) {
  const gateway = createOpenAI({
    baseURL: "https://ai-gateway.vercel.sh/v1",
    apiKey: env.VERCEL_AI_GATEWAY_KEY,
  })
  return gateway.chat(modelId)
}

export const CHAT_MODEL = "deepseek/deepseek-v4-flash"
