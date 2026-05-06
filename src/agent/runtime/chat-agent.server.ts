import { AIChatAgent } from "@cloudflare/ai-chat"
import type { StreamTextOnFinishCallback, ToolSet } from "ai"
import type { OnChatMessageOptions } from "@cloudflare/ai-chat"
import { runChatAgent } from "@/agent/definitions/chat.server"
import type { GeneralChatModelKey, ProviderOptions } from "@/agent/general-chat-models"

export class ChatAgent extends AIChatAgent<Env> {
  async onChatMessage(onFinish: StreamTextOnFinishCallback<ToolSet>, options?: OnChatMessageOptions) {
    const modelKey = options?.body?.modelKey as GeneralChatModelKey | undefined
    const providerOptions = options?.body?.providerOptions as ProviderOptions | undefined
    return (await runChatAgent(this.messages, onFinish, { modelKey, providerOptions })).toUIMessageStreamResponse()
  }

  async onRequest(request: Request): Promise<Response> {
    if (request.method === "DELETE") {
      this.messages = []
      return new Response(null, { status: 204 })
    }
    return super.onRequest(request)
  }
}
