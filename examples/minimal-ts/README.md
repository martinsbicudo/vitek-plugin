# minimal-ts

Minimal TypeScript example: one GET route, no React.

- **Run:** `pnpm i && pnpm run build && pnpm test` (build the plugin at repo root first so `dist/public/testing.js` exists)
- **Unit test:** `health.handler.test.ts` uses `createMockContext` from `vitek-plugin/testing`
- **Dev:** `pnpm run dev` then GET `http://localhost:5173/api/health`
