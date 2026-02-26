import { defineConfig } from "vite"
import { vitek } from "vitek-plugin"

export default defineConfig({
  plugins: [
    vitek({
      openApi: {
        info: {
          title: "Vitek Prisma Example API",
          version: "1.0.0",
          description: "Example API with Vitek and Prisma ORM (SQLite)",
        },
        servers: [{ url: "http://localhost:5173", description: "Development server" }],
      },
    }),
  ],
})
