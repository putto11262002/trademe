import { tool } from "ai"
import { z } from "zod"
import {
  listAgentSkills,
  loadAgentSkill,
  loadAgentSkillFile,
} from "@/agent/skills/registry.server"

const skillNameInput = z.object({
  name: z.string().trim().min(1).max(80).describe("Skill name, e.g. code-analysis-env"),
})

export const skillTools = {
  skill_list: tool({
    description:
      "List available agent skills with concise metadata. Use to discover skill names and reference files before loading a skill.",
    inputSchema: z.object({}),
    execute: async () => {
      return {
        found: true,
        skills: await listAgentSkills(),
      }
    },
  }),

  skill_load: tool({
    description:
      "Load a skill's SKILL.md entry point by name. This does not load reference files; use skill_read_file for referenced files only when needed.",
    inputSchema: skillNameInput,
    execute: async ({ name }) => {
      const { manifest, content } = await loadAgentSkill(name)
      return {
        found: true,
        name: manifest.name,
        title: manifest.title,
        description: manifest.description,
        content,
        references: manifest.files
          .filter((file) => file.type === "reference")
          .map(({ id, path, title, sha256, bytes }) => ({ id, path, title, sha256, bytes })),
        assets: manifest.files
          .filter((file) => file.type === "asset")
          .map(({ id, path, title, sha256, bytes }) => ({ id, path, title, sha256, bytes })),
        allowedTools: manifest.allowedTools ?? [],
      }
    },
  }),

  skill_read_file: tool({
    description:
      "Read one referenced skill file by skill name and file id or path. Use after skill_load when SKILL.md points to a reference that is needed.",
    inputSchema: skillNameInput.extend({
      file: z.string().trim().min(1).max(160).describe("Reference id or path, e.g. sdk or references/sdk.md"),
    }),
    execute: async ({ name, file }) => {
      const loaded = await loadAgentSkillFile(name, file)
      return {
        found: true,
        skillName: loaded.skillName,
        id: loaded.file.id,
        path: loaded.file.path,
        title: loaded.file.title,
        sha256: loaded.file.sha256,
        bytes: loaded.file.bytes,
        content: loaded.content,
      }
    },
  }),
}
