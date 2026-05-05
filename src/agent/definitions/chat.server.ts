import { streamText, convertToModelMessages, stepCountIs } from "ai"
import type { UIMessage, StreamTextOnFinishCallback, ToolSet } from "ai"
import { createModel, CHAT_MODEL } from "@/agent/gateway.server"
import { portfolioTools } from "@/agent/tools/portfolio.server"
import { stockTools } from "@/agent/tools/stock.server"

const SYSTEM_PROMPT = `You are a trading assistant for a retail investor holding US stocks. You have access to their live portfolio data and market information.

Be concise and direct. Ground your answers in actual numbers when available. When the user asks about their portfolio, always call get_portfolio first. When asked about a specific stock, use get_quote and get_company_info. For market news, use get_news.`

export async function runChatAgent(
  messages: UIMessage[],
  onFinish: StreamTextOnFinishCallback<ToolSet>,
) {
  const modelMessages = await convertToModelMessages(messages)
  return streamText({
    model: createModel(CHAT_MODEL),
    system: SYSTEM_PROMPT,
    tools: {
      ...portfolioTools,
      ...stockTools,
    },
    messages: modelMessages,
    stopWhen: stepCountIs(5),
    onFinish,
  })
}
