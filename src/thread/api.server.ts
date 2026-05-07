import { and, desc, eq, lt } from "drizzle-orm"
import { getDb } from "@/db/index.server"
import { thread } from "@/db/schema"
import { requireUser } from "@/auth/api.server"
import type { NewThread } from "./types"

export async function createThread(data: Omit<NewThread, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const db = getDb()
  const id = crypto.randomUUID()
  await db.insert(thread).values({ ...data, id })
  return id
}

export async function listThreads(userId: string, opts?: { cursor?: string; limit?: number }) {
  const limit = opts?.limit ?? 20
  const db = getDb()

  const rows = await db
    .select()
    .from(thread)
    .where(
      opts?.cursor
        ? and(eq(thread.userId, userId), lt(thread.updatedAt, new Date(opts.cursor)))
        : eq(thread.userId, userId),
    )
    .orderBy(desc(thread.updatedAt))
    .limit(limit + 1)

  const hasMore = rows.length > limit
  return {
    threads: hasMore ? rows.slice(0, limit) : rows,
    nextCursor: hasMore ? rows[limit - 1].updatedAt.toISOString() : null,
  }
}

export async function getThread(id: string) {
  const user = await requireUser()
  const db = getDb()
  const [row] = await db.select().from(thread).where(and(eq(thread.id, id), eq(thread.userId, user.id)))
  return row ?? null
}

export async function updateThread(id: string, data: Partial<Pick<NewThread, "title" | "modelKey" | "providerOptions">>) {
  const user = await requireUser()
  const db = getDb()
  await db
    .update(thread)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(thread.id, id), eq(thread.userId, user.id)))
}

export async function deleteThread(id: string) {
  const user = await requireUser()
  const db = getDb()
  await db.delete(thread).where(and(eq(thread.id, id), eq(thread.userId, user.id)))
}

export async function touchThread(id: string) {
  const db = getDb()
  await db.update(thread).set({ updatedAt: new Date() }).where(eq(thread.id, id))
}
