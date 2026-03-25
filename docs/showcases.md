# Showcases

**Showcases** are larger, story-driven apps under [`showcases/` on GitHub](https://github.com/martinsbicudo/vitek-plugin/tree/main/showcases). They combine several Vitek features in one coherent product-style narrative. They complement the smaller **examples** (see [Examples](./examples.md)), which usually isolate a single technique.

Planning, phases, and feature matrix: [SHOWCASES-PLAN.md](https://github.com/martinsbicudo/vitek-plugin/blob/main/docs/SHOWCASES-PLAN.md) (in the repo).

## Index

| Slug | Focus |
|------|--------|
| [OpsBoard](https://github.com/martinsbicudo/vitek-plugin/tree/main/showcases/ops-board) | Teams and tasks, React + `api.services.ts`, OpenAPI, admin middleware, contract check |
| [StockPulse](https://github.com/martinsbicudo/vitek-plugin/tree/main/showcases/stock-pulse) | Inventory movements, WebSocket low-stock alerts, OpenAPI + AsyncAPI contracts |
| [ReliableAPI](https://github.com/martinsbicudo/vitek-plugin/tree/main/showcases/reliable-api) | CORS, `maxBodySize`, `trustProxy`, `onError`, platform config, `withSpan`, `vitek.config.mjs` for serve |

Each folder has its own `README.md` with personas, commands, and links to guides.

## Running tests from the monorepo root

After `pnpm run build` at the root of `vitek-plugin`:

```bash
pnpm run showcases:build-and-test
```

Other scripts: `showcases:build`, `showcases:test`. These are included in **`pnpm run check`** after `examples:build-and-test`.

## Conventions

See [showcases/README.md](https://github.com/martinsbicudo/vitek-plugin/blob/main/showcases/README.md) for naming (`kebab-case`), `file:../..`, and CI notes.

## Quick tour

Run each app from its folder after `pnpm install --ignore-workspace` and `pnpm run dev` (with `pnpm run build` at the **vitek-plugin** repo root first so `file:../..` resolves).

### OpsBoard

1. Open `http://localhost:5173` — main UI (teams, tasks, activity).
2. Open `http://localhost:5173/api-docs.html` — OpenAPI UI.
3. In the UI, use **Admin summary**: without `X-User-Id` vs with header (middleware demo).

### StockPulse

1. Open `http://localhost:5173` — stock table and movement form.
2. Open `http://localhost:5173/api-docs.html` — REST and **WebSockets** (AsyncAPI) tabs.
3. Trigger a movement that pushes quantity **below** minimum — WebSocket panel should show a `low_stock` JSON message.

### ReliableAPI

1. Open `http://localhost:5173` — health, metrics, webhook button, crash route, internal issues.
2. Open `http://localhost:5173/api-docs.html` — contract surface.
3. Use **Internal issues**: **Without token** (401) vs **With token** (`reliable-api-demo`).
4. Optional: after `pnpm run build` and `pnpm run start`, confirm `dist/vitek.config.mjs` is loaded by **vitek-serve** (see each showcase README).

## Recording a short demo (optional)

You can record a 1–3 minute walkthrough (e.g. screen capture) following the steps above. Host the file wherever you prefer (release notes, blog, or team wiki) and link it from the showcase README if useful. Keeping the **written** tour here avoids stale embedded videos in the repo.

## Bundle size sanity check

Showcase frontends are standard Vite + React bundles; API output is dominated by **`dist/vitek-api.mjs`** (and **`dist/vitek-sockets.mjs`** when sockets are enabled). See [Bundle size](./guide/bundle-size.md) for how those bundles are built and how to keep them lean.

From a showcase directory after `pnpm run build`:

```bash
ls -lh dist/vitek-api.mjs dist/vitek-sockets.mjs 2>/dev/null
du -sh dist
```

Compare across showcases if you change shared libraries or add heavy imports to route files.
