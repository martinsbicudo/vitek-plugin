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
