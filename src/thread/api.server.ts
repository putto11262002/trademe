import { desc, eq } from "drizzle-orm"
import { getDb } from "@/db/index.server"
import { thread } from "@/db/schema"
import type { NewThread } from "./types"

export async function createThread(data: Omit<NewThread, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const db = getDb()
  const id = crypto.randomUUID()
  await db.insert(thread).values({ ...data, id })
  return id
}

export async function listThreads(userId: string) {
  const db = getDb()
  return db
    .select()
    .from(thread)
    .where(eq(thread.userId, userId))
    .orderBy(desc(thread.updatedAt))
}

export async function getThread(id: string) {
  const db = getDb()
  const [row] = await db.select().from(thread).where(eq(thread.id, id))
  return row ?? null
}

export async function updateThread(id: string, data: Partial<Pick<NewThread, "title" | "modelKey" | "providerOptions">>) {
  const db = getDb()
  await db
    .update(thread)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(thread.id, id))
}

export async function deleteThread(id: string) {
  const db = getDb()
  await db.delete(thread).where(eq(thread.id, id))
}

export async function touchThread(id: string) {
  const db = getDb()
  await db.update(thread).set({ updatedAt: new Date() }).where(eq(thread.id, id))
}
