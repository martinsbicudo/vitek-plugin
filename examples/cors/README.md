# cors

Example: CORS with restricted origin, methods, and headers.

In TypeScript configs you can type the object with `import type { CorsOptions } from 'vitek-plugin/plugin'` (or from `vitek-plugin`).

- **Run:** `pnpm i && pnpm run build && pnpm test`
- **Dev:** `pnpm run dev` then GET `http://localhost:5173/api/health` (from allowed origin to see CORS headers).
