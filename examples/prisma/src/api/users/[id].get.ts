import type { RouteHandler } from "vitek-plugin"
import { prisma } from "../../lib/db"

const GET: RouteHandler = async (context) => {
  const id = context.params?.id
  if (!id) {
    return { status: 400, body: { error: "id is required" } }
  }
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return { status: 404, body: { error: "user not found" } }
  }
  return { body: user }
}

export default GET
