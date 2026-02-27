# error-handling

Example: custom `onError` handler and route that throws. GET /api/fail triggers onError (503).

- **Run:** `pnpm i && pnpm run build && pnpm test`
- **Dev:** `pnpm run dev` then GET `http://localhost:5173/api/fail` to see 503 response.
