import { env } from "cloudflare:workers"
import { z } from "zod"
import type {
  AgentSkillMetadata,
  SkillManifestFile,
  SkillRegistryManifest,
  SkillVersionManifest,
} from "./types"
import { requiredAgentSkills, requiredSkill } from "./requirements.server"

const ROOT_MANIFEST_KEY = "skills/manifest.json"

const manifestFileSchema = z.object({
  id: z.string(),
  path: z.string(),
  title: z.string(),
  type: z.enum(["entry", "reference", "asset"]),
  sha256: z.string(),
  bytes: z.number(),
})

const skillVersionManifestSchema = z.object({
  name: z.string(),
  title: z.string(),
  description: z.string(),
  version: z.string(),
  commit: z.string().nullable(),
  skillContractVersion: z.number().int().positive(),
  status: z.enum(["active", "draft"]),
  entry: z.string(),
  files: z.array(manifestFileSchema),
  allowedTools: z.array(z.string()).optional(),
}) satisfies z.ZodType<SkillVersionManifest>

const skillRegistryManifestSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  commit: z.string().nullable(),
  skills: z.array(z.object({
    name: z.string(),
    title: z.string(),
    description: z.string(),
    activeVersion: z.string(),
    status: z.enum(["active", "draft"]),
    manifestPath: z.string(),
    checksum: z.string(),
    commit: z.string().nullable(),
    skillContractVersion: z.number().int().positive(),
    updatedAt: z.string(),
  })),
}) satisfies z.ZodType<SkillRegistryManifest>

export type SkillRegistryResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

export function renderSkillCatalogPrompt(): string {
  return [
    "Skills:",
    ...requiredAgentSkills.map((skill) => (
      `- ${skill.name}: ${skill.description} Required skill contract version: ${skill.skillContractVersion}.`
    )),
    "",
    "When a task would benefit from a skill, call skill_load before doing the work. skill_load returns only SKILL.md. If the loaded skill lists reference files you need, call skill_read_file for the specific file. Do not assume all skill files are already in context.",
  ].join("\n")
}

export async function listAgentSkills(): Promise<SkillRegistryResult<AgentSkillMetadata[]>> {
  const root = await readJson(ROOT_MANIFEST_KEY, skillRegistryManifestSchema)
  if (!root.ok) return root

  const skills: AgentSkillMetadata[] = []
  for (const entry of root.value.skills) {
    const manifest = await readJson(entry.manifestPath, skillVersionManifestSchema)
    if (!manifest.ok) return manifest
    const compatible = assertCompatibleSkill(manifest.value)
    if (!compatible.ok) return compatible
    skills.push({
      ...entry,
      references: manifest.value.files
        .filter((file) => file.type === "reference")
        .map(fileMetadata),
      assets: manifest.value.files
        .filter((file) => file.type === "asset")
        .map(fileMetadata),
      allowedTools: manifest.value.allowedTools ?? [],
    })
  }
  return { ok: true, value: skills }
}

export async function loadAgentSkill(name: string): Promise<SkillRegistryResult<{
  manifest: SkillVersionManifest
  content: string
}>> {
  const resolved = await resolveSkill(name)
  if (!resolved.ok) return resolved

  const entryFile = resolved.value.manifest.files.find((file) => file.path === resolved.value.manifest.entry)
  if (!entryFile) {
    return {
      ok: false,
      error: `Skill ${name}@${resolved.value.entry.activeVersion} has no entry file ${resolved.value.manifest.entry} in its manifest.`,
    }
  }

  const content = await readText(skillFileKey(name, resolved.value.entry.activeVersion, entryFile.path))
  if (!content.ok) return content

  return {
    ok: true,
    value: {
      manifest: resolved.value.manifest,
      content: content.value,
    },
  }
}

export async function loadAgentSkillFile(skillName: string, pathOrId: string): Promise<SkillRegistryResult<{
  skillName: string
  version: string
  file: SkillManifestFile
  content: string
}>> {
  const resolved = await resolveSkill(skillName)
  if (!resolved.ok) return resolved

  const file = resolved.value.manifest.files.find((item) => (
    item.id === pathOrId || item.path === pathOrId
  ))
  if (!file) {
    return {
      ok: false,
      error: `Skill file not found: ${skillName}@${resolved.value.entry.activeVersion}/${pathOrId}`,
    }
  }

  const content = await readText(skillFileKey(skillName, resolved.value.entry.activeVersion, file.path))
  if (!content.ok) return content

  return {
    ok: true,
    value: {
      skillName,
      version: resolved.value.entry.activeVersion,
      file,
      content: content.value,
    },
  }
}

async function resolveSkill(name: string): Promise<SkillRegistryResult<{
  entry: SkillRegistryManifest["skills"][number]
  manifest: SkillVersionManifest
}>> {
  const root = await readJson(ROOT_MANIFEST_KEY, skillRegistryManifestSchema)
  if (!root.ok) return root

  const entry = root.value.skills.find((skill) => skill.name === name)
  if (!entry) {
    return {
      ok: false,
      error: `Skill not found in R2 manifest ${ROOT_MANIFEST_KEY}: ${name}`,
    }
  }

  const manifest = await readJson(entry.manifestPath, skillVersionManifestSchema)
  if (!manifest.ok) return manifest
  const compatible = assertCompatibleSkill(manifest.value)
  if (!compatible.ok) return compatible

  return {
    ok: true,
    value: { entry, manifest: manifest.value },
  }
}

async function readText(key: string): Promise<SkillRegistryResult<string>> {
  const object = await env.STORAGE_BUCKET.get(key)
  if (!object) {
    return {
      ok: false,
      error: `Skill registry object not found in R2 at ${key}`,
    }
  }
  return { ok: true, value: await object.text() }
}

async function readJson<T>(key: string, schema: z.ZodType<T>): Promise<SkillRegistryResult<T>> {
  const content = await readText(key)
  if (!content.ok) return content

  let parsed: unknown
  try {
    parsed = JSON.parse(content.value)
  } catch {
    return {
      ok: false,
      error: `Skill registry object is not valid JSON: ${key}`,
    }
  }

  const result = schema.safeParse(parsed)
  if (!result.success) {
    return {
      ok: false,
      error: `Skill registry object failed validation at ${key}: ${z.prettifyError(result.error)}`,
    }
  }
  return { ok: true, value: result.data }
}

function skillFileKey(skillName: string, version: string, path: string): string {
  return `skills/${skillName}/${version}/${path}`
}

function assertCompatibleSkill(manifest: SkillVersionManifest): SkillRegistryResult<true> {
  const required = requiredSkill(manifest.name)
  if (!required) {
    return {
      ok: false,
      error: `Skill ${manifest.name}@${manifest.version} is not declared by this app build.`,
    }
  }
  if (manifest.skillContractVersion !== required.skillContractVersion) {
    return {
      ok: false,
      error: `Skill ${manifest.name}@${manifest.version} has contract version ${manifest.skillContractVersion}, but this app supports ${required.skillContractVersion}.`,
    }
  }
  return { ok: true, value: true }
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
