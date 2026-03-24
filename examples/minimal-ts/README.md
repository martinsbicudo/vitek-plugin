# minimal-ts

Minimal TypeScript — one GET route, no React.

This example commits [`.vitek/contract/openapi.snapshot.json`](./.vitek/contract/openapi.snapshot.json). After changing routes, refresh the baseline from this directory: `pnpm exec vitek contract snapshot`. Tests run `vitek contract check` after build.

- **Run:** `pnpm i && pnpm run build && pnpm test` (build the plugin at repo root first)
- **Post-build:** `post-build.test.ts` asserts major `vitek-plugin` subpath exports and runs `vitek contract check`
- **Unit test:** `health.handler.test.ts` uses `createMockContext` from `vitek-plugin/testing`
- **Dev:** `pnpm run dev` then GET `http://localhost:5173/api/health`
