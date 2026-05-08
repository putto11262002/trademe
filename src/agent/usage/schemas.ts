import { z } from "zod"

export const aiRunTypeSchema = z.enum(["chat", "slip_extraction"])

export type AiRunType = z.infer<typeof aiRunTypeSchema>
