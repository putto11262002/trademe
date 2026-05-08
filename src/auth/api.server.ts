import { auth } from "@clerk/tanstack-react-start/server"
import { eq } from "drizzle-orm"
import { getDb } from "@/db/index.server"
import { user } from "@/db/schema"
import type { User } from "./types"

export type AuthState =
  | { status: "unauthenticated" }
  | { status: "no_db_user" }
  | { status: "ok"; user: User }

export async function getCurrentUser(): Promise<AuthState> {
  const { userId } = await auth()
  if (!userId) return { status: "unauthenticated" }

  const db = getDb()
  const [row] = await db.select().from(user).where(eq(user.id, userId)).limit(1)
  if (!row) return { status: "no_db_user" }
  return { status: "ok", user: { id: row.id, email: row.email, displayName: row.displayName } }
}

export async function requireUser(): Promise<User> {
  const state = await getCurrentUser()
  if (state.status !== "ok") throw new Error("Not authenticated")
  return state.user
}
