export type SkillFileType = "entry" | "reference" | "asset"

export type SkillManifestFile = {
  id: string
  path: string
  title: string
  type: SkillFileType
  sha256: string
  bytes: number
}

export type SkillManifest = {
  name: string
  title: string
  description: string
  entry: string
  files: SkillManifestFile[]
  allowedTools?: string[]
}

export type SkillRegistryEntry = {
  name: string
  entry: string
  manifest: string
}

export type SkillRegistryManifest = {
  schemaVersion: 1
  generatedAt: string
  skills: SkillRegistryEntry[]
}

export type AgentSkillMetadata = {
  name: string
  title: string
  description: string
  entry: string
  manifest: string
  references: Array<Pick<SkillManifestFile, "id" | "path" | "title" | "sha256" | "bytes">>
  assets: Array<Pick<SkillManifestFile, "id" | "path" | "title" | "sha256" | "bytes">>
  allowedTools: string[]
}
