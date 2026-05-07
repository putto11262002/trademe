import { env } from "cloudflare:workers"
import { z } from "zod"
import type {
  AgentSkillMetadata,
  SkillManifest,
  SkillManifestFile,
  SkillRegistryManifest,
} from "./types"
import { R2JsonStore } from "./r2.server"

const ROOT_MANIFEST_KEY = "skills/manifest.json"
export const SUPPORTED_SKILL_NAMES = ["code-analysis-env"] as const

const manifestFileSchema = z.object({
  id: z.string(),
  path: z.string(),
  title: z.string(),
  type: z.enum(["entry", "reference", "asset"]),
  sha256: z.string(),
  bytes: z.number(),
})

const skillManifestSchema = z.object({
  name: z.string(),
  title: z.string(),
  description: z.string(),
  entry: z.string(),
  files: z.array(manifestFileSchema),
  allowedTools: z.array(z.string()).optional(),
}) satisfies z.ZodType<SkillManifest>

const skillRegistryManifestSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  skills: z.array(z.object({
    name: z.string(),
    entry: z.string(),
    manifest: z.string(),
  })),
}) satisfies z.ZodType<SkillRegistryManifest>

export class SkillRegistry {
  constructor(
    private readonly store = new R2JsonStore(env.STORAGE_BUCKET),
  ) {}

  async list(): Promise<AgentSkillMetadata[]> {
    const root = await this.rootManifest()
    const skills: AgentSkillMetadata[] = []

    for (const entry of root.skills) {
      this.assertDeclared(entry.name)
      const manifest = await this.skillManifest(entry.manifest)
      skills.push({
        name: entry.name,
        title: manifest.title,
        description: manifest.description,
        entry: entry.entry,
        manifest: entry.manifest,
        references: manifest.files
          .filter((file) => file.type === "reference")
          .map(fileMetadata),
        assets: manifest.files
          .filter((file) => file.type === "asset")
          .map(fileMetadata),
        allowedTools: manifest.allowedTools ?? [],
      })
    }

    return skills
  }

  async load(name: string): Promise<{
    manifest: SkillManifest
    content: string
  }> {
    const resolved = await this.resolve(name)
    const entryFile = resolved.manifest.files.find((file) => file.path === resolved.manifest.entry)
    if (!entryFile) {
      throw new Error(`Skill ${name} has no entry file ${resolved.manifest.entry} in its manifest.`)
    }

    return {
      manifest: resolved.manifest,
      content: await this.store.readText(skillFileKey(name, entryFile.path)),
    }
  }

  async readFile(skillName: string, pathOrId: string): Promise<{
    skillName: string
    file: SkillManifestFile
    content: string
  }> {
    const resolved = await this.resolve(skillName)
    const file = resolved.manifest.files.find((item) => (
      item.id === pathOrId || item.path === pathOrId
    ))
    if (!file) {
      throw new Error(`Skill file not found: ${skillName}/${pathOrId}`)
    }

    return {
      skillName,
      file,
      content: await this.store.readText(skillFileKey(skillName, file.path)),
    }
  }

  private async resolve(name: string): Promise<{
    entry: SkillRegistryManifest["skills"][number]
    manifest: SkillManifest
  }> {
    this.assertDeclared(name)

    const root = await this.rootManifest()
    const entry = root.skills.find((skill) => skill.name === name)
    if (!entry) {
      throw new Error(`Skill not found in R2 manifest ${ROOT_MANIFEST_KEY}: ${name}`)
    }

    return {
      entry,
      manifest: await this.skillManifest(entry.manifest),
    }
  }

  private async rootManifest() {
    return this.store.readJson(ROOT_MANIFEST_KEY, skillRegistryManifestSchema)
  }

  private async skillManifest(key: string) {
    return this.store.readJson(key, skillManifestSchema)
  }

  private assertDeclared(name: string): void {
    if (!isSupportedSkill(name)) {
      throw new Error(`Skill ${name} is not declared by this app build.`)
    }
  }
}

export const skillRegistry = new SkillRegistry()

export function listAgentSkills() {
  return skillRegistry.list()
}

export function loadAgentSkill(name: string) {
  return skillRegistry.load(name)
}

export function loadAgentSkillFile(skillName: string, pathOrId: string) {
  return skillRegistry.readFile(skillName, pathOrId)
}

function skillFileKey(skillName: string, path: string): string {
  return `skills/${skillName}/${path}`
}

function isSupportedSkill(name: string): boolean {
  return SUPPORTED_SKILL_NAMES.includes(name as (typeof SUPPORTED_SKILL_NAMES)[number])
}

function fileMetadata(file: SkillManifestFile) {
  return {
    id: file.id,
    path: file.path,
    title: file.title,
    sha256: file.sha256,
    bytes: file.bytes,
  }
}
