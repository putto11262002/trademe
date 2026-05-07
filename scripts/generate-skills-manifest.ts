import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { readdir, readFile, stat, writeFile } from "node:fs/promises"
import path from "node:path"

type SkillStatus = "active" | "draft"

type Frontmatter = {
  name: string
  description: string
  skillContractVersion?: string
}

type SkillFile = {
  id: string
  path: string
  title: string
  type: "entry" | "reference" | "asset"
  sha256: string
  bytes: number
}

const SKILLS_DIR = path.join(process.cwd(), "skills")
const DEFAULT_DEV_VERSION = "dev"
const DEFAULT_SKILL_CONTRACT_VERSION = 1

async function main() {
  const version = parseVersion()
  const commit = parseCommit()
  const skillNames = await readdir(SKILLS_DIR)
  const generatedAt = new Date().toISOString()
  const skills = []

  for (const skillName of skillNames.sort()) {
    const skillDir = path.join(SKILLS_DIR, skillName)
    const info = await stat(skillDir)
    if (!info.isDirectory()) continue

    const skillMdPath = path.join(skillDir, "SKILL.md")
    const skillMd = await readFile(skillMdPath, "utf8")
    const frontmatter = parseFrontmatter(skillMd, skillMdPath)
    if (frontmatter.name !== skillName) {
      throw new Error(`Skill folder ${skillName} does not match frontmatter name ${frontmatter.name}`)
    }

    const files: SkillFile[] = [
      await fileMetadata(skillDir, "SKILL.md", "entry"),
      ...await nestedFiles(skillDir, "references", "reference"),
      ...await nestedFiles(skillDir, "assets", "asset"),
    ]

    const manifest = {
      name: skillName,
      title: titleFromName(skillName),
      description: frontmatter.description,
      version,
      commit,
      skillContractVersion: parseSkillContractVersion(frontmatter.skillContractVersion),
      status: "active" satisfies SkillStatus,
      entry: "SKILL.md",
      files,
      allowedTools: skillName === "code-analysis-env" ? ["analysis_run_code"] : [],
    }

    const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`
    await writeFile(path.join(skillDir, "manifest.json"), manifestJson)

    skills.push({
      name: skillName,
      title: manifest.title,
      description: manifest.description,
      activeVersion: version,
      status: manifest.status,
      manifestPath: `skills/${skillName}/${version}/manifest.json`,
      checksum: sha256(manifestJson),
      commit,
      skillContractVersion: manifest.skillContractVersion,
      updatedAt: generatedAt,
    })
  }

  const rootManifest = {
    schemaVersion: 1,
    generatedAt,
    commit,
    skills,
  }
  await writeFile(path.join(SKILLS_DIR, "manifest.json"), `${JSON.stringify(rootManifest, null, 2)}\n`)
}

function parseVersion(): string {
  const arg = process.argv.find((item) => item.startsWith("--version="))
  const version = arg?.slice("--version=".length) ?? process.env.SKILL_VERSION ?? DEFAULT_DEV_VERSION
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,80}$/.test(version)) {
    throw new Error(`Invalid skill version: ${version}`)
  }
  return version
}

function parseCommit(): string | null {
  const arg = process.argv.find((item) => item.startsWith("--commit="))
  return arg?.slice("--commit=".length) ?? process.env.GITHUB_SHA ?? gitCommit()
}

function gitCommit(): string | null {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: process.cwd(),
    encoding: "utf8",
  })
  if (result.status !== 0) return null
  return result.stdout.trim()
}

function parseFrontmatter(content: string, filePath: string): Frontmatter {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/)
  if (!match) throw new Error(`Missing YAML frontmatter in ${filePath}`)

  const fields = Object.fromEntries(
    match[1]
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const idx = line.indexOf(":")
        if (idx === -1) throw new Error(`Invalid frontmatter line in ${filePath}: ${line}`)
        return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
      }),
  )

  if (!fields.name || !fields.description) {
    throw new Error(`Frontmatter in ${filePath} must include name and description`)
  }
  return {
    name: fields.name,
    description: fields.description,
    skillContractVersion: fields.skillContractVersion,
  }
}

function parseSkillContractVersion(value: string | undefined): number {
  if (!value) return DEFAULT_SKILL_CONTRACT_VERSION
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`skillContractVersion must be a positive integer, got: ${value}`)
  }
  return parsed
}

async function nestedFiles(skillDir: string, dirName: "references" | "assets", type: "reference" | "asset"): Promise<SkillFile[]> {
  const dir = path.join(skillDir, dirName)
  try {
    const info = await stat(dir)
    if (!info.isDirectory()) return []
  } catch {
    return []
  }

  const result: SkillFile[] = []
  await collectFiles(skillDir, dir, type, result)
  return result.sort((a, b) => a.path.localeCompare(b.path))
}

async function collectFiles(skillDir: string, currentDir: string, type: "reference" | "asset", result: SkillFile[]) {
  for (const entry of await readdir(currentDir)) {
    const fullPath = path.join(currentDir, entry)
    const info = await stat(fullPath)
    if (info.isDirectory()) {
      await collectFiles(skillDir, fullPath, type, result)
      continue
    }
    const relativePath = path.relative(skillDir, fullPath).split(path.sep).join("/")
    result.push(await fileMetadata(skillDir, relativePath, type))
  }
}

async function fileMetadata(skillDir: string, relativePath: string, type: SkillFile["type"]): Promise<SkillFile> {
  const content = await readFile(path.join(skillDir, relativePath))
  return {
    id: idFromPath(relativePath),
    path: relativePath,
    title: titleFromPath(relativePath),
    type,
    sha256: sha256(content),
    bytes: content.byteLength,
  }
}

function idFromPath(value: string): string {
  if (value === "SKILL.md") return "entry"
  return value
    .replace(/^references\//, "")
    .replace(/^assets\//, "")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
}

function titleFromPath(value: string): string {
  if (value === "SKILL.md") return "Skill Entry"
  return titleFromName(path.basename(value).replace(/\.[^.]+$/, ""))
}

function titleFromName(value: string): string {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`)
    .join(" ")
}

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex")
}

await main()
