import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import * as api from "./api.server"
import { MarketNotFoundError } from "./errors"
import type { CompanyProfile } from "./types"

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

const profileInput = z.object({
  ticker: z.string().min(1).max(10).transform((s) => s.trim().toUpperCase()),
})

export const getCompanyProfileFn = createServerFn({ method: "GET" })
  .inputValidator(profileInput)
  .handler(async ({ data }): Promise<CompanyProfile | null> => {
    try {
      return await api.getCompanyProfile(data.ticker)
    } catch (err) {
      if (err instanceof MarketNotFoundError) return null
      throw err
    }
  })
