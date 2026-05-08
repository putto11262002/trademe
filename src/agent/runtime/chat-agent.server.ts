import { AIChatAgent } from "@cloudflare/ai-chat"
import { createUIMessageStream, createUIMessageStreamResponse } from "ai"
import type { StreamTextOnFinishCallback, ToolSet } from "ai"
import type { OnChatMessageOptions } from "@cloudflare/ai-chat"
import { verifyToken } from "@clerk/backend"
import { runChatAgent } from "@/agent/definitions/chat.server"
import type { GeneralChatModelKey, ProviderOptions } from "@/agent/general-chat-models"

export class ChatAgent extends AIChatAgent<Env> {
  userId = ""

  async onChatMessage(onFinish: StreamTextOnFinishCallback<ToolSet>, options?: OnChatMessageOptions) {
    const modelKey = options?.body?.modelKey as GeneralChatModelKey | undefined
    const providerOptions = options?.body?.providerOptions as ProviderOptions | undefined

    const result = await runChatAgent(this.messages, onFinish, { modelKey, providerOptions, userId: this.userId })

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        writer.merge(result.toUIMessageStream() as unknown as ReadableStream<never>)
        const usage = await result.totalUsage
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        writer.write({ type: "data-token-usage" as any, data: { inputTokens: usage.inputTokens ?? 0, outputTokens: usage.outputTokens ?? 0 } } as never)
      },
    })

    return createUIMessageStreamResponse({ stream })
  }

  async onRequest(request: Request): Promise<Response> {
    const sessionToken = request.headers.get("cookie")?.match(/(?:^|;\s*)__session=([^;]+)/)?.[1]
    if (!sessionToken) return new Response("Unauthorized", { status: 401 })
    let payload: Awaited<ReturnType<typeof verifyToken>>
    try {
      payload = await verifyToken(sessionToken, { secretKey: process.env.CLERK_SECRET_KEY })
    } catch {
      return new Response("Unauthorized", { status: 401 })
    }
    this.userId = payload.sub

    if (request.method === "DELETE") {
      this.messages = []
      return new Response(null, { status: 204 })
    }
    return super.onRequest(request)
  }
}
