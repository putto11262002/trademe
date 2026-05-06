import { AIChatAgent } from "@cloudflare/ai-chat"
import type { StreamTextOnFinishCallback, ToolSet } from "ai"
import type { OnChatMessageOptions } from "@cloudflare/ai-chat"
import { runChatAgent } from "@/agent/definitions/chat.server"
import type { ModelKey, ThinkingLevel } from "@/agent/models"

export class ChatAgent extends AIChatAgent<Env> {
  async onChatMessage(onFinish: StreamTextOnFinishCallback<ToolSet>, options?: OnChatMessageOptions) {
    const modelKey = options?.body?.model as ModelKey | undefined
    const thinking = options?.body?.thinking as ThinkingLevel | undefined
    return (await runChatAgent(this.messages, onFinish, { modelKey, thinking })).toUIMessageStreamResponse()
  }

  async onRequest(request: Request): Promise<Response> {
    if (request.method === "DELETE") {
      this.messages = []
      return new Response(null, { status: 204 })
    }
    return super.onRequest(request)
  }
}
