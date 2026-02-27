# validation-only

Minimal example: one POST route using `validateBody` from vitek-plugin. Invalid body returns 422.

- **Run:** `pnpm i && pnpm run build && pnpm test`
- **Dev:** `pnpm run dev` then POST to `http://localhost:5173/api/echo` with JSON body `{"name":"x","count":1}`
