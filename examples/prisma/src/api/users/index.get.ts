import type { RouteHandler } from "vitek-plugin"
import { prisma } from "../../lib/db"

const GET: RouteHandler = async () => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } })
  return { body: users }
}

export default GET
