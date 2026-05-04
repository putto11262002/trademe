import { createServerFn } from "@tanstack/react-start"
import * as api from "./api.server"
import { addTradeSchema } from "./validation"

export const addTradeFn = createServerFn({ method: "POST" })
  .inputValidator(addTradeSchema)
  .handler(async ({ data }) => api.addTrade(data))

export const listTradesFn = createServerFn({ method: "GET" }).handler(
  async () => api.listTrades(),
)

export const getPositionsFn = createServerFn({ method: "GET" }).handler(
  async () => api.getPositions(),
)
