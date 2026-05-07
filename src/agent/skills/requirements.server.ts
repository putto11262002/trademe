export const requiredAgentSkills = [
  {
    name: "code-analysis-env",
    description:
      "Use for bounded Python analysis over stock, candle, portfolio, market, news, and fundamentals data.",
    skillContractVersion: 1,
  },
] as const

export function requiredSkill(name: string) {
  return requiredAgentSkills.find((skill) => skill.name === name) ?? null
}
