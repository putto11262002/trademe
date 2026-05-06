import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import * as api from "./api.server"

const searchInput = z.object({
  query: z.string().max(50).default(""),
  limit: z.number().int().positive().max(50).optional(),
  offset: z.number().int().min(0).optional(),
})

export const searchCompanyProfilesFn = createServerFn({ method: "GET" })
  .inputValidator(searchInput)
  .handler(async ({ data }) =>
    api.searchCompanyProfiles(data.query, data.limit, data.offset),
  )
