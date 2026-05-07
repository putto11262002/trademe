export type ProviderOptions = Record<string, Record<string, string | number | boolean | null>>

export type ThinkingLevel = {
  key: string
  label: string
  providerOptions: ProviderOptions
}

export type GeneralChatModel = {
  id: string
  label: string
  contextWindow: number
  thinking?: {
    levels: ThinkingLevel[]
    default: ProviderOptions
  }
}

export const generalChatModels = {
  flash: {
    id: "deepseek/deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    contextWindow: 65536,
  },
  pro: {
    id: "deepseek/deepseek-v4-pro",
    label: "DeepSeek V4 Pro",
    contextWindow: 65536,
    thinking: {
      levels: [
        { key: "off",  label: "Off",  providerOptions: {} },
        { key: "high", label: "High", providerOptions: { openai: { reasoning_effort: "medium" } } },
        { key: "max",  label: "Max",  providerOptions: { openai: { reasoning_effort: "high" } } },
      ],
      default: {},
    },
  },
} satisfies Record<string, GeneralChatModel>

export type GeneralChatModelKey = keyof typeof generalChatModels

export const DEFAULT_GENERAL_CHAT_MODEL: GeneralChatModelKey = "flash"
