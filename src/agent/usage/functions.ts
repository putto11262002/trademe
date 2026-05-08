import { createServerFn } from "@tanstack/react-start"
import { requireUser } from "@/auth/api.server"
import { getDailyUsage, getMonthlyUsageSummary, getRecentRuns } from "./api.server"

export const getUsageSummaryFn = createServerFn({ method: "GET" }).handler(async () => {
  const { id: userId } = await requireUser()
  return getMonthlyUsageSummary(userId)
})

export const getDailyUsageFn = createServerFn({ method: "GET" }).handler(async () => {
  const { id: userId } = await requireUser()
  return getDailyUsage(userId, 30)
})

export const getRecentRunsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { id: userId } = await requireUser()
  return getRecentRuns(userId, 20)
})
