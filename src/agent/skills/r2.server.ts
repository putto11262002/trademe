import { z } from "zod"

export async function readR2Text(bucket: R2Bucket, key: string): Promise<string> {
  const object = await bucket.get(key)
  if (!object) {
    throw new Error(`Skill registry object not found in R2 at ${key}`)
  }
  return object.text()
}

export async function readR2Json<T>(bucket: R2Bucket, key: string, schema: z.ZodType<T>): Promise<T> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await readR2Text(bucket, key))
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Skill registry object is not valid JSON: ${key}`)
    }
    throw error
  }

  const result = schema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`Skill registry object failed validation at ${key}: ${z.prettifyError(result.error)}`)
  }
  return result.data
}
