import { createServerFn } from "@tanstack/react-start"
import { getCurrentUser } from "./api.server"

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
  async () => getCurrentUser(),
)
