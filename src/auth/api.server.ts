import { auth } from "@clerk/tanstack-react-start/server"
import { eq } from "drizzle-orm"
import { getDb } from "@/db/index.server"
import { user } from "@/db/schema"
import type { User } from "./types"

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth()
  if (!userId) return null

  const db = getDb()
  const [row] = await db.select().from(user).where(eq(user.id, userId)).limit(1)
  return row ? { id: row.id, email: row.email, displayName: row.displayName } : null
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  return user
}
