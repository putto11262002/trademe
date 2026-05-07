import { readdir, readFile } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import path from "node:path"

type RootManifest = {
  skills: Array<{
    name: string
    activeVersion: string
  }>
}

type WranglerConfig = {
  r2_buckets?: Array<{ binding: string; bucket_name: string }>
  env?: Record<string, {
    r2_buckets?: Array<{ binding: string; bucket_name: string }>
  }>
}

const SKILLS_DIR = path.join(process.cwd(), "skills")
const STORAGE_BINDING = "STORAGE_BUCKET"

async function main() {
  const envName = parseEnv()
  const bucket = await bucketForEnv(envName)
  const rootManifest = JSON.parse(
    await readFile(path.join(SKILLS_DIR, "manifest.json"), "utf8"),
  ) as RootManifest

  const uploads: Array<{ source: string; key: string }> = []

  for (const skill of rootManifest.skills) {
    const skillDir = path.join(SKILLS_DIR, skill.name)
    const version = skill.activeVersion
    uploads.push(
      ...await collectSkillUploads(skillDir, `skills/${skill.name}/${version}`),
    )
  }

  for (const upload of uploads.filter((item) => !item.key.endsWith("/manifest.json"))) {
    uploadObject(bucket, upload.key, upload.source)
  }
  for (const upload of uploads.filter((item) => item.key.endsWith("/manifest.json"))) {
    uploadObject(bucket, upload.key, upload.source)
  }
  uploadObject(bucket, "skills/manifest.json", path.join(SKILLS_DIR, "manifest.json"))
}

function parseEnv(): string {
  const envArg = process.argv.find((arg) => arg.startsWith("--env="))
  const envName = envArg?.slice("--env=".length) ?? process.env.CLOUDFLARE_ENV
  if (!envName) {
    throw new Error("Usage: tsx scripts/upload-skills-to-r2.ts --env=dev|production")
  }
  return envName
}

async function bucketForEnv(envName: string): Promise<string> {
  const config = JSON.parse(await readFile(path.join(process.cwd(), "wrangler.jsonc"), "utf8")) as WranglerConfig
  const normalized = envName === "prod" ? "production" : envName
  const buckets = normalized === "production"
    ? config.r2_buckets
    : config.env?.[normalized]?.r2_buckets
  const bucket = buckets?.find((item) => item.binding === STORAGE_BINDING)?.bucket_name
  if (!bucket) {
    throw new Error(`No ${STORAGE_BINDING} R2 bucket configured for env "${envName}"`)
  }
  return bucket
}

async function collectSkillUploads(skillDir: string, keyPrefix: string) {
  const uploads: Array<{ source: string; key: string }> = [
    { source: path.join(skillDir, "SKILL.md"), key: `${keyPrefix}/SKILL.md` },
    { source: path.join(skillDir, "manifest.json"), key: `${keyPrefix}/manifest.json` },
  ]

  for (const nested of await collectNestedFiles(skillDir, "references")) {
    uploads.push({
      source: path.join(skillDir, nested),
      key: `${keyPrefix}/${nested}`,
    })
  }
  for (const nested of await collectNestedFiles(skillDir, "assets")) {
    uploads.push({
      source: path.join(skillDir, nested),
      key: `${keyPrefix}/${nested}`,
    })
  }

  return uploads
}

async function collectNestedFiles(skillDir: string, dirName: string): Promise<string[]> {
  const root = path.join(skillDir, dirName)
  try {
    await readdir(root)
  } catch {
    return []
  }
  const result: string[] = []
  await walk(skillDir, root, result)
  return result
}

async function walk(skillDir: string, currentDir: string, result: string[]) {
  for (const entry of await readdir(currentDir, { withFileTypes: true })) {
    const fullPath = path.join(currentDir, entry.name)
    if (entry.isDirectory()) {
      await walk(skillDir, fullPath, result)
      continue
    }
    result.push(path.relative(skillDir, fullPath).split(path.sep).join("/"))
  }
}

function uploadObject(bucket: string, key: string, source: string) {
  const target = `${bucket}/${key}`
  const result = spawnSync("pnpm", [
    "wrangler",
    "r2",
    "object",
    "put",
    target,
    "--file",
    source,
    "--remote",
  ], {
    cwd: process.cwd(),
    stdio: "inherit",
  })

  if (result.status !== 0) {
    throw new Error(`Failed to upload ${source} to ${target}`)
  }
}

await main()
