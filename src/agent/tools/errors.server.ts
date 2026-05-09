import type { StopCondition, ToolSet } from "ai"

export type AgentToolErrorMode = "recoverable" | "terminal"

export class AgentToolError extends Error {
  constructor(
    message: string,
    readonly mode: AgentToolErrorMode,
    readonly toolName: string,
    readonly phase?: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = "AgentToolError"
  }
}

export function isTerminalAgentToolError(error: unknown): boolean {
  return (
    error instanceof AgentToolError
    || (
      typeof error === "object"
      && error != null
      && "name" in error
      && "mode" in error
      && error.name === "AgentToolError"
    )
  ) && (error as { mode?: unknown }).mode === "terminal"
}

export const stopOnTerminalToolError: StopCondition<ToolSet> = ({ steps }) => {
  const step = steps.at(-1)
  if (!step) return false

  const content = Array.isArray((step as { content?: unknown }).content)
    ? (step as { content: Array<{ type?: string; error?: unknown }> }).content
    : []
  const toolResults = Array.isArray((step as { toolResults?: unknown }).toolResults)
    ? (step as { toolResults: Array<{ type?: string; error?: unknown }> }).toolResults
    : []

  const toolErrors = [
    ...content.filter((part) => part.type === "tool-error"),
    ...toolResults.filter((part) => part.type === "tool-error"),
  ]

  return toolErrors.some((part) => isTerminalAgentToolError(part.error))
}
