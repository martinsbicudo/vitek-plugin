# Examples

This repository includes multiple complete examples demonstrating different use cases of the Vitek plugin. Each example is self-contained and can be run independently. See [examples/README.md](https://github.com/martinsbicudo/vitek-plugin/blob/main/examples/README.md) for the **full list and comparison table**, including **platform-doctor**, **platform-events**, **platform-generate**, **platform-schedule**, **issue-dispatch**, **observability**, **minimal-ts** (contract drift in CI), **mcp-project**, socket-only, import-external, prisma, **vite6-minimal**, and the rest.

From the repository root, **`pnpm run examples:test`** runs every example’s Vitest suite (with per-example install so `file:../..` stays in sync). Use **`pnpm run examples:build-and-test`** for a full build + test cycle on all examples.

**Showcases** ([`showcases/` on GitHub](https://github.com/martinsbicudo/vitek-plugin/tree/main/showcases)) are larger, story-driven apps that combine several features (e.g. [OpsBoard](https://github.com/martinsbicudo/vitek-plugin/tree/main/showcases/ops-board): React UI, generated client, OpenAPI, admin middleware, contract check). They are not part of `examples:test` by default; see [showcases/README.md](https://github.com/martinsbicudo/vitek-plugin/blob/main/showcases/README.md) and [SHOWCASES-PLAN.md](https://github.com/martinsbicudo/vitek-plugin/blob/main/docs/SHOWCASES-PLAN.md).

## basic-js

**Pure JavaScript, no frameworks**

Minimal example with pure JavaScript. No TypeScript, no React. Simple HTML page with fetch API. Perfect for understanding the basics.

**Key features:** Pure JavaScript, no frameworks, simple HTML + fetch, basic routes, generated `api.services.js`.

**When to use:** Start here to learn the fundamentals without any framework overhead.

**Tech stack:** JavaScript, Vite, HTML.

---

## js-react

**JavaScript with React (no TypeScript)**

React application in JavaScript. Uses generated services without TypeScript types. Demonstrates Vitek integration with React. Intermediate complexity.

**Key features:** React with JSX, no TypeScript, generated JS services, React Hooks examples.

**When to use:** React projects that prefer JavaScript; teams not ready for TypeScript.

**Tech stack:** JavaScript, React, Vite, JSX.

---

## typescript-react

**Complete TypeScript with React**

Full-featured example with TypeScript and React. Complete type-safety with generated types. Hierarchical middlewares. All HTTP methods and advanced features. Most comprehensive example.

**Key features:** TypeScript, full type-safety, React, hierarchical middlewares, all HTTP methods, dynamic params, typed body/query, response helpers, HTTP error classes, request validation.

**When to use:** Production-ready apps; teams using TypeScript; reference implementation.

**Tech stack:** TypeScript, React, Vite, TSX.

---

## docker

**TypeScript + React with Docker and docker-compose**

Same app as typescript-react, runnable in a container. Uses pnpm for install and scripts. No database or extra services.

**Key features:** TypeScript, React, full type-safety (same as typescript-react), Dockerfile and docker-compose for containerized dev. Install and build inside the container use pnpm.

**When to use:** Containerized development or deployment; teams standardizing on Docker; CI environments.

**Tech stack:** TypeScript, React, Vite, TSX, Docker, docker-compose, pnpm.

**Run with Docker:** From `examples/docker`, run `docker compose up --build`, then open `http://localhost:5173`. No need to build the plugin from the repo root—the example uses the published vitek-plugin from npm. All examples include a **start** script (vitek-serve) for production: after `vite build`, run `pnpm start` to serve static + API. The [docker example](https://github.com/martinsbicudo/vitek-plugin/blob/main/examples/docker/README.md) documents production with Docker (vitek-serve).

---

## api-docs

**API documentation (REST + WebSockets)**

Example with OpenAPI and AsyncAPI generation enabled. Single docs page with REST (Swagger UI) and WebSockets (AsyncAPI) tabs.

**Key features:** OpenAPI 3.0, AsyncAPI 2.x, Swagger UI, TypeScript.

**When to use:** Adding API documentation (HTTP and WebSockets) to your project.

**Tech stack:** TypeScript, Vite. See [OpenAPI](/guide/openapi) for the guide.

---

## observability

**Platform observability and `withSpan`**

Minimal TypeScript app with `vitek.platform.json` (`observability`, `issueDispatch`), structured request logs, `X-Request-Id` / `context.requestId`, and a route using `withSpan` from `vitek-plugin/observability`.

**Key features:** `vitek.platform.json`, request correlation, stub span API for future tracing.

**When to use:** Learning how platform flags affect the dev server and production (`vitek-serve`); copy patterns into your app.

**Tech stack:** TypeScript, Vite. See [Observability](/guide/observability) and [AI Platform Config](/guide/ai-platform-config).

---

## issue-dispatch

**Custom issue dispatcher**

`vitek.platform.json` enables `issueDispatch`; `vite.config.ts` passes `issueDispatcher` to buffer `IssueEvent` payloads. Demo routes trigger HTTP warnings and uncaught errors (with runtime **suggestions**), and `GET /api/issues` returns the buffered list.

**Tech stack:** TypeScript, Vite. See [AI Platform Config](/guide/ai-platform-config) and [examples/issue-dispatch](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/issue-dispatch).

---

## platform-doctor

**`vitek doctor`**

`vitek.platform.json` with `features.doctor`; tests run `vitek doctor --json` and validate the report shape.

**Tech stack:** TypeScript, Vite. [Doctor](/guide/doctor.md).

---

## platform-events

**`createEventBus`**

Typed in-process event bus (`vitek-plugin/events`) with routes to emit audit events and list recent entries.

**Tech stack:** TypeScript, Vite. [Events and Scheduler](/guide/events-scheduler.md).

---

## platform-generate

**`vitek generate crud`**

`features.dataGenerators: true`; build runs `vitek generate crud GenItem --adapter prisma --out src/api/genitems` (output gitignored, recreated on each build).

**Tech stack:** TypeScript, Vite. [Data Generators](/guide/data-generators.md).

---

## platform-schedule

**`vitek schedule run`**

`vitek.schedule.mjs` exports `defineSchedule({ tasks })`; tests invoke `vitek schedule run --json`.

**Tech stack:** TypeScript, Vite. [Events and Scheduler](/guide/events-scheduler.md).

---

## minimal-ts (contract in CI)

**Smallest TypeScript API with contract drift check**

Single health route plus a committed `.vitek/contract/openapi.snapshot.json`. Tests run `vitek contract check` after build.

**When to use:** Reference for wiring [Contract drift](/guide/contract) in a tiny project.

---

## Comparison Table

The table below is a short subset. For **import-external**, **validation-only**, **rate-limit**, **cors**, **alias**, **build-api-false**, **issue-dispatch**, platform examples, and more, see the [examples README](https://github.com/martinsbicudo/vitek-plugin/blob/main/examples/README.md#-comparison-table).

| Feature            | socket-only | basic-js   | js-react   | typescript-react | docker      | api-docs     |
| ------------------ | ----------- | ---------- | ---------- | ---------------- | ----------- | ------------ |
| Language           | JavaScript  | JavaScript | JavaScript | TypeScript       | TypeScript  | TypeScript   |
| Framework          | None        | None       | React      | React            | React       | —            |
| WebSockets         | Yes (focus) | Yes        | Yes        | Yes              | Yes         | Yes          |
| Type Safety        | No          | No         | No         | Yes              | Yes         | Yes          |
| Response Helpers   | No          | No         | No         | Yes              | Yes         | Yes          |
| Error Classes      | No          | No         | No         | Yes              | Yes         | Yes          |
| Validation         | No          | No         | No         | Yes              | Yes         | Yes          |
| Generated Types    | No          | No         | No         | Yes              | Yes         | Yes          |
| Generated Services | Socket (JS) | Yes (JS)   | Yes (JS)   | Yes (TS)         | Yes (TS)    | Yes (TS)     |
| Middlewares        | No          | No         | No         | Yes              | Yes         | —            |
| HTTP Methods       | Optional    | GET, POST  | GET, POST  | All methods      | All methods | —            |
| Docker             | No          | No         | No         | No               | Yes         | No           |
| OpenAPI            | No          | No         | No         | No               | No          | Yes          |
| Complexity         | Low         | Low        | Medium     | High             | High        | Low          |
| Best For           | WebSockets  | Learning   | React (JS) | Production       | Docker      | API docs     |

---

## Quick Start

1. **Build the plugin** from the project root:

   ```bash
   npm run build
   # or
   pnpm build
   ```

2. **Go to an example** and install (for **docker**, skip to step 2b if using Docker):

   ```bash
   cd examples/socket-only   # or basic-js, js-react, typescript-react
   npm install
   # or
   pnpm install
   ```

   **docker only:** From `examples/docker`, run `docker compose up --build` (uses pnpm inside the container). No need to build the plugin from the repo root.

3. **Start the dev server:**

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Open your browser at `http://localhost:5173`.

5. **Production (optional):** Run `pnpm run build` then `pnpm run start` (vitek-serve) to serve the built app with the API. See [Production server](/guide/production-server).

---

## Links to Example READMEs

- [examples/README.md](https://github.com/martinsbicudo/vitek-plugin/blob/main/examples/README.md) — index of all examples and scripts
- [socket-only](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/socket-only) — WebSocket-only example
- [basic-js](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/basic-js) — JavaScript, no framework
- [js-react](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/js-react) — React + JavaScript
- [typescript-react](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/typescript-react) — full TypeScript + React reference
- [docker](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/docker) — Docker and docker-compose (pnpm)
- [api-docs](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/api-docs) — OpenAPI + AsyncAPI docs
- [import-external](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/import-external) — shared libs outside `api/`
- [prisma](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/prisma) — Prisma + SQLite
- [minimal-ts](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/minimal-ts) — contract check in CI
- [mcp-project](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/mcp-project) — `vitek mcp` + platform config

---

## Troubleshooting

- **Plugin not found:** Run `npm run build` or `pnpm build` from the repository root, then try the example again.
- **Routes not working:** Ensure route files follow the `[name].[method].ts` or `.js` convention and export a default handler.

For more, see the [examples README](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples) troubleshooting section.
