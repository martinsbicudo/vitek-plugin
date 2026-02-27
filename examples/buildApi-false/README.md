# buildApi-false

Example: `buildApi: false` — API runs only in dev; no API bundle in `dist/` after build.

- **Run:** `pnpm i && pnpm run build && pnpm test`
- **Dev:** `pnpm run dev` then GET `http://localhost:5173/api/health`
