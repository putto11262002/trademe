import { auth, clerkClient } from "@clerk/tanstack-react-start/server"
import { eq } from "drizzle-orm"
import { getDb } from "@/db/index.server"
import { user } from "@/db/schema"
import { upsertUser } from "@/user/api.server"
import type { User } from "./types"

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth()
  if (!userId) return null

  const db = getDb()
  const [row] = await db.select().from(user).where(eq(user.id, userId)).limit(1)
  if (row) return { id: row.id, email: row.email, displayName: row.displayName }

  // Lazy-create: race before first webhook fires
  const clerk = await clerkClient()
  const clerkUser = await clerk.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? ""
  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    email
  await upsertUser({ id: userId, email, displayName })
  return { id: userId, email, displayName }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  return user
}
