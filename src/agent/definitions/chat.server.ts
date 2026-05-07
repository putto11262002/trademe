import { streamText, convertToModelMessages, stepCountIs } from "ai"
import type { UIMessage, StreamTextOnFinishCallback, ToolSet } from "ai"
import { createModel } from "@/agent/gateway.server"
import { generalChatModels, DEFAULT_GENERAL_CHAT_MODEL, type GeneralChatModelKey, type ProviderOptions } from "@/agent/general-chat-models"
import { renderSkillCatalogPrompt } from "@/agent/skills/registry.server"
import { analysisTools } from "@/agent/tools/analysis.server"
import { portfolioTools } from "@/agent/tools/portfolio.server"
import { skillTools } from "@/agent/tools/skills.server"
import { stockTools } from "@/agent/tools/stock.server"

const SYSTEM_PROMPT = `You are TradeMe's stock analysis assistant for a retail investor holding US stocks.

Scope:
- Only help with stock, market, portfolio, and investment-analysis questions.
- If the user asks for unrelated work, politely decline and ask for a stock or portfolio analysis question.
- Do not recommend trades, submit orders, or tell the user to buy, sell, or hold. Frame outputs as informational analysis.

Tools:
- Use portfolio_* tools for questions about the user's holdings, performance, allocation, risk, concentration, gains/losses, or portfolio impact.
- Use market_* tools for quotes, company context, fundamentals, earnings, analyst context, FX, and compact price-history summaries.
- Use news_* tools for recent headlines and source context.
- Use the most specific compact tool before asking for broader data.
- Use analysis_run_code as a bounded code execution environment when the answer requires calculations, candle analysis, time-series analysis, technical indicators, portfolio concentration, returns, volatility, drawdown, comparisons, or other numerical work.

Code execution rules:
- Use analysis_run_code only for stock, market, or portfolio analysis tasks.
- If a task needs detailed code execution guidance, load the relevant skill before using analysis_run_code.

Be concise and direct. Do not use emojis. Ground answers in actual numbers when available. Explain the computed result in plain English, including uncertainty or data gaps.`

export type ChatAgentOptions = {
  modelKey?: GeneralChatModelKey
  providerOptions?: ProviderOptions
}

export async function runChatAgent(
  messages: UIMessage[],
  onFinish: StreamTextOnFinishCallback<ToolSet>,
  opts: ChatAgentOptions = {},
) {
  const modelKey = (opts.modelKey ?? DEFAULT_GENERAL_CHAT_MODEL) as GeneralChatModelKey
  const modelId = generalChatModels[modelKey]?.id ?? generalChatModels[DEFAULT_GENERAL_CHAT_MODEL].id
  const modelMessages = await convertToModelMessages(messages)

  return streamText({
    model: createModel(modelId),
    system: [SYSTEM_PROMPT, renderSkillCatalogPrompt()].join("\n\n"),
    tools: {
      ...skillTools,
      ...portfolioTools,
      ...stockTools,
      ...analysisTools,
    },
    messages: modelMessages,
    stopWhen: stepCountIs(10),
    providerOptions: opts.providerOptions,
    onFinish,
  })
}
