import { AIChatAgent } from "@cloudflare/ai-chat"
import type { StreamTextOnFinishCallback, ToolSet } from "ai"
import { runChatAgent } from "@/agent/definitions/chat.server"

export class ChatAgent extends AIChatAgent<Env> {
  async onChatMessage(onFinish: StreamTextOnFinishCallback<ToolSet>) {
    return (await runChatAgent(this.messages, onFinish)).toUIMessageStreamResponse()
  }

  async onRequest(request: Request): Promise<Response> {
    if (request.method === "DELETE") {
      this.messages = []
      return new Response(null, { status: 204 })
    }
    return super.onRequest(request)
  }
}
