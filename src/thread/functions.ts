import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import * as api from "./api.server"
import { createThreadSchema, updateThreadSchema } from "./schemas"

export const createThreadFn = createServerFn({ method: "POST" })
  .inputValidator(createThreadSchema)
  .handler(async ({ data }) => {
    const id = await api.createThread(data)
    return id
  })

export const listThreadsFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ userId: z.string().min(1) }))
  .handler(async ({ data }) => api.listThreads(data.userId))

export const getThreadFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => api.getThread(data.id))

export const updateThreadFn = createServerFn({ method: "POST" })
  .inputValidator(updateThreadSchema)
  .handler(async ({ data }) => {
    const { id, ...rest } = data
    await api.updateThread(id, rest)
  })

export const deleteThreadFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => api.deleteThread(data.id))
