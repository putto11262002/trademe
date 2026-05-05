import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import * as api from "./api.server"
import * as portfolio from "./portfolio.server"
import * as positionDetail from "./position-detail.server"
import { addTradeSchema } from "./schemas"

export const addTradeFn = createServerFn({ method: "POST" })
  .inputValidator(addTradeSchema)
  .handler(async ({ data }) => api.addTrade(data))

export const listTradesFn = createServerFn({ method: "GET" }).handler(
  async () => api.listTrades(),
)

export const getPositionsFn = createServerFn({ method: "GET" }).handler(
  async () => api.getPositions(),
)

export const getPortfolioDashboardFn = createServerFn({ method: "GET" }).handler(
  async () => portfolio.getPortfolioDashboard(),
)

const tickerInput = z.object({ ticker: z.string().min(1).max(20) })

export const getPositionDetailFn = createServerFn({ method: "GET" })
  .inputValidator(tickerInput)
  .handler(async ({ data }) => positionDetail.getPositionDetail(data.ticker))
