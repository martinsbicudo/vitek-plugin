import type { RouteHandler } from "vitek-plugin"

const GET: RouteHandler = async () => ({
  ok: true,
  service: "vitek-prisma-example",
  timestamp: new Date().toISOString(),
})

export default GET
