import { streamText, convertToModelMessages, stepCountIs } from "ai"
import type { UIMessage, StreamTextOnFinishCallback, ToolSet } from "ai"
import { createModel } from "@/agent/gateway.server"
import { MODELS, DEFAULT_MODEL, DEFAULT_THINKING, type ModelKey, type ThinkingLevel } from "@/agent/models"
import { portfolioTools } from "@/agent/tools/portfolio.server"
import { stockTools } from "@/agent/tools/stock.server"

const SYSTEM_PROMPT = `You are a trading assistant for a retail investor holding US stocks. You have access to their live portfolio data and market information.

Be concise and direct. Ground your answers in actual numbers when available. When the user asks about their portfolio, always call get_portfolio first. When asked about a specific stock, use get_quote and get_company_info. For market news, use get_news.`

export type ChatAgentOptions = {
  modelKey?: ModelKey
  thinking?: ThinkingLevel
}

export async function runChatAgent(
  messages: UIMessage[],
  onFinish: StreamTextOnFinishCallback<ToolSet>,
  opts: ChatAgentOptions = {},
) {
  const modelKey = (opts.modelKey ?? DEFAULT_MODEL) as ModelKey
  const thinking = opts.thinking ?? DEFAULT_THINKING
  const modelId = MODELS[modelKey]?.id ?? MODELS[DEFAULT_MODEL].id
  const modelMessages = await convertToModelMessages(messages)

  return streamText({
    model: createModel(modelId, thinking),
    system: SYSTEM_PROMPT,
    tools: {
      ...portfolioTools,
      ...stockTools,
    },
    messages: modelMessages,
    stopWhen: stepCountIs(10),
    providerOptions: thinking !== "off" ? {
      openai: { reasoning_effort: thinking === "max" ? "high" : "medium" },
    } : undefined,
    onFinish,
  })
}
