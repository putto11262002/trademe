import { z } from "zod"

export class R2JsonStore {
  constructor(private readonly bucket: R2Bucket) {}

  async readText(key: string): Promise<string> {
    const object = await this.bucket.get(key)
    if (!object) {
      throw new Error(`Skill registry object not found in R2 at ${key}`)
    }
    return object.text()
  }

  async readJson<T>(key: string, schema: z.ZodType<T>): Promise<T> {
    let parsed: unknown
    try {
      parsed = JSON.parse(await this.readText(key))
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
}
