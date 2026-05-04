import type { User } from "./types"
import { MOCK_USER } from "./mock"

export async function getCurrentUser(): Promise<User | null> {
  return MOCK_USER
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")
  return user
}
