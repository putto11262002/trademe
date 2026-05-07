export type AgentSkillStatus = "active" | "draft"

export type SkillFileType = "entry" | "reference" | "asset"

export type SkillManifestFile = {
  id: string
  path: string
  title: string
  type: SkillFileType
  sha256: string
  bytes: number
}

export type SkillVersionManifest = {
  name: string
  title: string
  description: string
  version: string
  status: AgentSkillStatus
  entry: string
  files: SkillManifestFile[]
  allowedTools?: string[]
}

export type SkillRegistryEntry = {
  name: string
  title: string
  description: string
  activeVersion: string
  status: AgentSkillStatus
  manifestPath: string
  checksum: string
  updatedAt: string
}

export type SkillRegistryManifest = {
  schemaVersion: 1
  generatedAt: string
  skills: SkillRegistryEntry[]
}

export type AgentSkillMetadata = SkillRegistryEntry & {
  references: Array<Pick<SkillManifestFile, "id" | "path" | "title" | "sha256" | "bytes">>
  assets: Array<Pick<SkillManifestFile, "id" | "path" | "title" | "sha256" | "bytes">>
  allowedTools: string[]
}
