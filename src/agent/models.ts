export type ThinkingLevel = "off" | "high" | "max"

export type ModelConfig = {
  id: string
  label: string
  supportsThinking: boolean
  thinkingLevels?: ThinkingLevel[]
}

export const MODELS = {
  flash: {
    id: "deepseek/deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    supportsThinking: false,
  },
  pro: {
    id: "deepseek/deepseek-v4-pro",
    label: "DeepSeek V4 Pro",
    supportsThinking: true,
    thinkingLevels: ["off", "high", "max"] as ThinkingLevel[],
  },
  kimi: {
    id: "moonshotai/kimi-k2.5",
    label: "Kimi K2.5",
    supportsThinking: false,
  },
  kimiThinking: {
    id: "moonshotai/kimi-k2-thinking",
    label: "Kimi K2 Thinking",
    supportsThinking: true,
    thinkingLevels: ["off", "high", "max"] as ThinkingLevel[],
  },
} satisfies Record<string, ModelConfig>

export type ModelKey = keyof typeof MODELS

export const DEFAULT_MODEL: ModelKey = "flash"
export const DEFAULT_THINKING: ThinkingLevel = "off"

export const THINKING_LABELS: Record<ThinkingLevel, string> = {
  off: "Off",
  high: "High",
  max: "Max",
}
