# ReliableAPI — Vitek showcase

Near-real **integration-style API** with a production checklist: **strict CORS**, **`maxBodySize`** (413 for oversized bodies), **`trustProxy`**, custom **`onError`** in dev and **`dist/vitek.config.mjs`** for **vitek-serve**, **`beforeApiRequest`** plugins (API version header + request counter), hierarchical **middleware** on `/api/internal/*`, **`vitek.platform.json`** with **observability** and **issue dispatch** (in-memory buffer), and **`withSpan`** on a slow report route.

This is a **showcase**, not a micro-recipe. See [`examples/cors`](../../examples/cors), [`examples/observability`](../../examples/observability), [`examples/issue-dispatch`](../../examples/issue-dispatch), [`examples/platform-doctor`](../../examples/platform-doctor) for focused samples.

## Personas (story)

| Persona | Goal |
|---------|------|
| **External integrator** | POST webhooks with a small JSON body; read OpenAPI at `/api-docs.html`. |
| **SRE** | Inspect **`X-Request-Id`** on health (when observability runs in the HTTP pipeline), **`GET /api/metrics`** for a simple request counter, run **`pnpm run doctor`**. |
| **Platform / product** | Inspect buffered **issue** events via **`GET /api/internal/issues`** with **`X-Internal-Token`**. |

## Architecture (high level)

```
Browser (React) → generated api.services.ts + fetch for error demos

vite.config.ts     cors, maxBodySize, trustProxy, onError, plugins[], issueDispatcher, openApi, sockets: false
vitek.platform.json   features.observability + features.issueDispatch
dist/vitek.config.mjs   beforeApiRequest + onError for vitek-serve (copied at build)

src/api/internal/*      middleware.ts (X-Internal-Token: reliable-api-demo)
```

Behind a **reverse proxy**, enable **`trustProxy: true`** (already set here for demonstration) so `X-Forwarded-*` is respected. See [Production server](../../docs/guide/production-server.md).

## Features demonstrated

| Vitek capability | Where |
|------------------|-------|
| `cors` object | Explicit dev origins + methods + headers |
| `maxBodySize` | 4096 bytes (payloads larger than this get **413** in real HTTP) |
| `trustProxy` | `vite.config.ts` |
| `onError` | Dev: JSON `{ error, detail }`; prod: `vitek.config.mjs` |
| `plugins[].beforeApiRequest` | Metrics bump + `X-API-Version: 1` |
| `issueDispatcher` | In-memory ring buffer; `internal/issues.get.ts` |
| `withSpan` | `report/slow.get.ts` |
| Middleware | `internal/middleware.ts` |
| OpenAPI + contract | `.vitek/contract/openapi.snapshot.json`, `pnpm test` |
| `vitek doctor` | `pnpm run doctor` (also asserted in `post-build.test.ts`) |

## Prerequisites

From the **repository root** (for `file:../..`):

```bash
cd /path/to/vitek-plugin
pnpm run build
```

## Run locally

```bash
cd showcases/reliable-api
pnpm install --ignore-workspace
pnpm run dev
```

Open the UI, **`/api-docs.html`**, and try **Internal issues** buttons: without token the browser receives **401** from the live server (middleware runs in the HTTP pipeline).

## Build, test, production

```bash
pnpm run build    # tsc + vite build + cp vitek.config.mjs → dist/
pnpm test         # post-build + vitek contract check + doctor --json
pnpm run start    # vitek-serve (after build)
```

## Regenerating the contract snapshot

```bash
pnpm run build
pnpm exec vitek contract snapshot
```

Commit `.vitek/contract/openapi.snapshot.json`.

## Links

- [Configuration](../../docs/guide/configuration.md)
- [Error handling](../../docs/guide/error-handling.md)
- [Security](../../docs/guide/security.md)
- [Observability](../../docs/guide/observability.md)
- [AI platform config](../../docs/guide/ai-platform-config.md)
- [Production server](../../docs/guide/production-server.md)
- [Doctor](../../docs/guide/doctor.md)
