import { eq } from "drizzle-orm"
import { getDb } from "@/db/index.server"
import { user } from "@/db/schema"

export type UpsertUserInput = {
  id: string
  email: string
  displayName: string
}

export async function upsertUser(data: UpsertUserInput): Promise<void> {
  const db = getDb()
  await db
    .insert(user)
    .values({ ...data, createdAt: new Date(), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: user.id,
      set: { email: data.email, displayName: data.displayName, updatedAt: new Date() },
    })
}

export async function deleteUser(id: string): Promise<void> {
  const db = getDb()
  await db.delete(user).where(eq(user.id, id))
}
