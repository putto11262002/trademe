import type { UIMessage } from "ai"

export type ChatMessageMetadata = {
  finishReason?: string
}

export type ChatMessage = UIMessage<ChatMessageMetadata>
