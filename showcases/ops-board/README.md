# OpsBoard — Vitek showcase

Near-real **task board by team**: REST API under `src/api/`, React UI consuming generated **`api.services.ts`**, **OpenAPI** (Swagger at `/api-docs.html`), **hierarchical middleware** on `/api/admin/*` (mock auth via `X-User-Id`), **`validateBody`** on `POST /api/tasks`, and **contract drift** checks via committed `.vitek/contract/openapi.snapshot.json`.

This is a **showcase** (multi-feature story), not a micro-recipe. For single-feature examples see [`examples/`](../../examples/README.md).

## Personas (story)

| Persona | Goal |
|---------|------|
| **PM / lead** | See tasks grouped by team; filter by team in the UI. |
| **Developer** | Create tasks with a typed POST body; get **422** when validation fails. |
| **Ops** | Scan **recent activity** from the API (`GET /api/activity`). |
| **Admin** | Call **`GET /api/admin/summary`** only with **`X-User-Id`** (middleware rejects otherwise). |

## Architecture (high level)

```
Browser (React)
    → fetch via generated api.services.ts (same origin /api/*)
        → Vitek dev server or vitek-serve (static + API)

src/api/               file-based routes → vitek-api.mjs bundle
src/lib/store.ts       in-memory teams/tasks/activity (demo only)
```

## Features demonstrated

| Vitek capability | Where |
|------------------|--------|
| Nested routes + params | `teams/[id].get.ts`, `teams/[id]/tasks.get.ts`, `tasks/[id].get.ts` |
| `POST` with generated **Body** type | `tasks.post.ts` exports `Body` → `TasksPostBody` + `postTasks()` |
| Query typing | `activity.get.ts` exports `Query` → `getActivity(query)` |
| OpenAPI | `vite.config.ts` → `openApi.info` |
| Middleware | `admin/middleware.ts` → `UnauthorizedError` without `X-User-Id` |
| Validation | `validateBody` in `tasks.post.ts` |
| Contract CI | `pnpm test` runs `vitek contract check` |
| Production | `vite build` then `vitek-serve` (see below) |

## Prerequisites

Build the plugin from the **repository root** when using `file:../..`:

```bash
cd /path/to/vitek-plugin
pnpm run build
```

## Run locally

```bash
cd showcases/ops-board
pnpm install --ignore-workspace
pnpm run dev
```

Open `http://localhost:5173` (UI) and `http://localhost:5173/api-docs.html` (Swagger).

## Build, test, production

```bash
pnpm run build    # tsc + vite build (generates api.types.ts, api.services.ts, dist/, OpenAPI files)
pnpm test         # post-build + vitek contract check
pnpm run start    # vitek-serve — static + API (after build)
```

See [Production server](../../docs/guide/production-server.md) for `vitek-serve` options (`--host`, `--port`, etc.).

## Regenerating the contract snapshot

When routes or OpenAPI-relevant code change intentionally:

```bash
pnpm run build
pnpm exec vitek contract snapshot
```

Commit `.vitek/contract/openapi.snapshot.json`. Then `pnpm test` must pass.

## Links

- [OpenAPI / Swagger](../../docs/guide/openapi.md)
- [Production server](../../docs/guide/production-server.md)
- [Contract drift (CI)](../../docs/guide/contract.md)
- [Middlewares](../../docs/guide/middlewares.md)
- [Request validation](../../docs/guide/request-validation.md)
- [Showcases plan](../../docs/SHOWCASES-PLAN.md)

### Related `examples/` (unchanged)

- [`examples/typescript-react`](../../examples/typescript-react) — broader TS + React patterns  
- [`examples/api-docs`](../../examples/api-docs) — docs-heavy setup  
- [`examples/minimal-ts`](../../examples/minimal-ts) — contract check minimal setup  

## Disclaimer

In-memory store resets on process restart; auth is **mock** headers for demonstration only.
