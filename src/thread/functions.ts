import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import * as api from "./api.server"
import { requireUser } from "@/auth/api.server"
import { createThreadSchema, updateThreadSchema } from "./schemas"

export const createThreadFn = createServerFn({ method: "POST" })
  .inputValidator(createThreadSchema)
  .handler(async ({ data }) => api.createThread(data))

export const listThreadsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({
    userId: z.string().min(1),
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  }))
  .handler(async ({ data }) => api.listThreads(data.userId, { cursor: data.cursor, limit: data.limit }))

export const getThreadFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { id: userId } = await requireUser()
    return api.getThread(data.id, userId)
  })

export const updateThreadFn = createServerFn({ method: "POST" })
  .inputValidator(updateThreadSchema)
  .handler(async ({ data }) => {
    const { id: userId } = await requireUser()
    const { id, ...rest } = data
    await api.updateThread(id, rest, userId)
  })

export const deleteThreadFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { id: userId } = await requireUser()
    return api.deleteThread(data.id, userId)
  })

export const touchThreadFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => api.touchThread(data.id))
