import type { RouteHandler } from "vitek-plugin"
import { prisma } from "../../lib/db"

const POST: RouteHandler = async (context) => {
  const { body } = context
  const { email, name } = (body ?? {}) as { email: string; name?: string }
  if (!email?.trim()) {
    return { status: 400, body: { error: "email is required" } }
  }
  const user = await prisma.user.create({
    data: { email: email.trim(), name: name?.trim() || null },
  })
  return { status: 201, body: user }
}

export default POST
