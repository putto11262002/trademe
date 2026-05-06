export type ThinkingLevel = "off" | "high" | "max"

export type ModelConfig = {
  id: string
  label: string
  description: string
  supportsThinking: boolean
  thinkingLevels?: ThinkingLevel[]
}

export const MODELS = {
  flash: {
    id: "deepseek/deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    description: "Fast · lightweight",
    supportsThinking: false,
  },
  pro: {
    id: "deepseek/deepseek-v4-pro",
    label: "DeepSeek V4 Pro",
    description: "Smarter · optional thinking",
    supportsThinking: true,
    thinkingLevels: ["off", "high", "max"] as ThinkingLevel[],
  },
  kimi: {
    id: "moonshotai/kimi-k2.5",
    label: "Kimi K2.5",
    description: "262K ctx · multimodal",
    supportsThinking: false,
  },
  kimiThinking: {
    id: "moonshotai/kimi-k2-thinking",
    label: "Kimi K2 Thinking",
    description: "Always-on reasoning",
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
