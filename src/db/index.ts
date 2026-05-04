import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

function create() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is not set")
  return drizzle({ client: neon(url), schema })
}

let _db: ReturnType<typeof create> | undefined

export function getDb() {
  return (_db ??= create())
}

export type Database = ReturnType<typeof create>
