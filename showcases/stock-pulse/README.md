# StockPulse — Vitek showcase

Near-real **inventory** story: REST for levels and movements, **WebSocket** channel for **low-stock alerts**, **OpenAPI** + **AsyncAPI** (combined docs at `/api-docs.html`), and **contract snapshots** for both specs.

This is a **showcase** (multi-feature narrative), not a micro-recipe. For isolated examples see [`examples/`](../../examples/README.md) (`socket-only`, `api-docs`, `platform-events`).

## Personas (story)

| Persona | Goal |
|---------|------|
| **Warehouse** | Record stock **in** / **out** with validation and clear errors. |
| **Store / desk** | See current quantity and minimum threshold per SKU. |
| **Manager** | Get **real-time** low-stock signals on the `alerts` WebSocket. |

## Architecture (high level)

```
Browser (React)
    → getHealth / getStock via generated api.services.ts
    → connectAlerts() from socket.services.ts
    → fetch POST /api/movements (typed body via MovementsPostBody) for error status codes

src/api/*.ts, *.socket.ts   file-based HTTP + sockets → dist bundles
src/lib/store.ts            in-memory SKUs (demo only)
```

## Features demonstrated

| Vitek capability | Where |
|------------------|-------|
| REST + `validateBody` | `movements.post.ts` |
| `NotFoundError` | `stock/[sku].get.ts` |
| `ConflictError` (409) | outbound movement beyond available qty |
| WebSocket handler | `alerts.socket.ts` (`VitekSocketContext`) |
| Generated clients | `api.services.ts`, `socket.services.ts` |
| OpenAPI + AsyncAPI UI | `vite.config.ts` → `openApi`; sockets default on |
| Contract CI | `pnpm test` → `vitek contract check` (OpenAPI + AsyncAPI snapshots) |
| Production | `vite build` then `vitek-serve` |

## Prerequisites

Build the plugin from the **repository root** when using `file:../..`:

```bash
cd /path/to/vitek-plugin
pnpm run build
```

## Run locally

```bash
cd showcases/stock-pulse
pnpm install --ignore-workspace
pnpm run dev
```

Open `http://localhost:5173` (UI) and `http://localhost:5173/api-docs.html` (REST + WebSockets tabs).

## Build, test, production

```bash
pnpm run build    # tsc + vite build → dist/, generated clients, openapi/asyncapi JSON
pnpm test         # post-build + vitek contract check
pnpm run start    # vitek-serve (after build)
```

See [Production server](../../docs/guide/production-server.md).

## Regenerating contract snapshots

When routes or docs-relevant code change on purpose:

```bash
pnpm run build
pnpm exec vitek contract snapshot
```

Commit `.vitek/contract/openapi.snapshot.json` and `.vitek/contract/asyncapi.snapshot.json`.

## Screenshots (optional)

Suggested captures for READMEs or release notes:

- Main UI with the stock table and movement form.
- `api-docs.html` with the **WebSockets** / AsyncAPI tab visible.
- WebSocket alerts panel after a movement drives quantity **below** minimum.

## Links

- [OpenAPI / AsyncAPI](../../docs/guide/openapi.md)
- [WebSockets](../../docs/guide/websockets.md)
- [Contract drift](../../docs/guide/contract.md)
- Examples: [`socket-only`](../../examples/socket-only), [`api-docs`](../../examples/api-docs), [`platform-events`](../../examples/platform-events)
