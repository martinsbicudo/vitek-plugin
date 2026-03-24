# Issue dispatch example

Shows how to plug a **custom `IssueDispatcher`** into `vitek()` so you can buffer or forward structured issue events (errors, optional suggestions) from the HTTP runtime.

## Setup

- `vitek.platform.json` has `features.issueDispatch: true`.
- `vite.config.ts` passes `issueDispatcher` from `src/lib/issue-buffer.ts` into `vitek({ issueDispatcher })`.

## Flow

1. `GET /api/fail` — handler throws a normal `Error`. The runtime emits an **error**-severity issue with **suggestions** (from the core request handler).
2. `GET /api/http-issue` — handler throws `NotFoundError`. The runtime emits a **warning**-severity issue (HTTP errors).
3. `GET /api/issues` — returns JSON `{ issues: IssueEvent[] }` from the in-memory buffer (newest first). Each item may include `suggestions[]` with `title` / optional `detail`.

The dispatcher also logs a one-line summary to the terminal.

## Production (`vitek-serve`)

You can export `issueDispatcher` from `dist/vitek.config.mjs` instead of using `vite.config.ts`. See [AI Platform Config](../../docs/guide/ai-platform-config.md) and [Production server](../../docs/guide/production-server.md).

## Dev vs bundle

The buffer uses `globalThis` so the dispatcher (loaded with Vite config) and route handlers (API bundle) share the same in-memory list in development and preview.

## Types

Use `import type { IssueEvent, IssueDispatcher } from 'vitek-plugin'` or `vitek-plugin/dispatch`.
