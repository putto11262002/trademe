import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import * as api from "./api.server"
import { requireUser } from "@/auth/api.server"

const parseSlipInput = z.object({
  imageBase64: z.string().min(1, "Image required").max(10_000_000),
  contentType: z
    .string()
    .regex(/^image\/(png|jpeg|jpg|webp)$/, "Unsupported image type"),
})

export const parseSlipFn = createServerFn({ method: "POST" })
  .inputValidator(parseSlipInput)
  .handler(async ({ data }) => {
    const { id: userId } = await requireUser()
    const image = base64ToBytes(data.imageBase64)
    return api.parseSlip({ image, contentType: data.contentType }, userId)
  })

function base64ToBytes(b64: string): Uint8Array {
  const stripped = b64.includes(",") ? b64.split(",")[1]! : b64
  const binary = atob(stripped)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
