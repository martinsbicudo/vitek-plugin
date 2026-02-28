<div align="center">
  <img src="./docs/public/logo.webp" alt="Vitek Plugin Logo" width="200" height="200" />
  
  # Vitek Plugin
  
  **File-based HTTP API generation for Vite**
  
  [![Version](https://img.shields.io/badge/version-0.2.1--beta-orange.svg)](https://github.com/martinsbicudo/vitek-plugin)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Vite](https://img.shields.io/badge/vite-^5.0.0%20%7C%7C%20^6.0.0-646CFF.svg)](https://vitejs.dev/)
  
  > **Beta Version**: This project is currently in beta. APIs may change in future releases.
</div>

---

Vitek is a Vite plugin that turns a folder of files into an HTTP API.

**Note:** The API runs with the Vite **development server** (`npm run dev` / `pnpm dev`). For **production**, run `vite build` then **vitek-serve** (add `"start": "vitek-serve"` to your scripts and run `pnpm start`)—this serves both static assets and the API from one process. `vite preview` is for quick local preview of the static build only; for static + API use vitek-serve. Set `buildApi: false` if you do not want the API in build/production. Write endpoints as `[name].[method].ts` (or `.js`) under `src/api`, and get automatic routing, type generation, typed client helpers, and **OpenAPI/Swagger documentation**.

**Full documentation:** [docs/](./docs/) · [View online](https://martinsbicudo.github.io/vitek-plugin/) (VitePress — run `npm run docs:dev` or `pnpm docs:dev` to view locally).

**MCP:** Expose your project API to AI assistants (Cursor, Claude) with `vitek mcp` — [MCP – API do projeto](docs/guide/mcp-project.md).

**Examples:** [examples/](./examples/) — `basic-js`, `js-react`, `typescript-react`, `import-external`, `socket-only`, `api-docs`, `prisma`, and `docker`.

---

## Quick Start

**Option A — scaffold with init (recommended for new projects):**

```bash
npm install vitek-plugin
npx vitek init
```

Then `npm run dev` and open `http://localhost:5173/api/health`. The init command creates `src/api/health.get.ts` and adds vitek to your Vite config.

**Option B — manual setup:**

```bash
npm install vitek-plugin
```

**vite.config.ts:**

```typescript
import { defineConfig } from "vite";
import { vitek } from "vitek-plugin";

export default defineConfig({
  plugins: [vitek()],
});
```

**src/api/health.get.ts:**

```typescript
import type { VitekContext } from "vitek-plugin";

export default function handler(_context: VitekContext) {
  return { status: "ok", timestamp: new Date().toISOString() };
}
```

Then `npm run dev` and open `http://localhost:5173/api/health`.

---

## API documentation (OpenAPI + AsyncAPI)

Vitek can automatically generate OpenAPI 3.0 (REST) and AsyncAPI 2.x (WebSockets) specifications and serve interactive documentation:

```typescript
import { defineConfig } from "vite";
import { vitek } from "vitek-plugin";

export default defineConfig({
  plugins: [
    vitek({
      openApi: true, // Enable with defaults
      // or: openApi: { info: { title: "My API" } }
    }),
  ],
});
```

Then open `http://localhost:5173/api-docs.html` for interactive API documentation.

- **REST (OpenAPI)** – Swagger UI with "Try it out"
- **WebSockets (AsyncAPI)** – When you have socket routes, the same page gets a **WebSockets** tab with AsyncAPI docs
- **Automatic generation** from your route and socket files
- **JSDoc support** – Document with `@summary`, `@tag`, `@response`, etc.
- **Type extraction** – Body and Query types become schemas
- **Zero config required** – Works out of the box with sensible defaults

[Learn more →](./docs/guide/openapi.md)

---

## Security

- **Body size**: Use `maxBodySize` (bytes) in plugin options or in `vitek.config.mjs` for production to reject oversized bodies with 413 and avoid unbounded memory use.
- **CORS**: Configure `cors` (e.g. specific `origin`) in production; avoid `*` with credentials.
- **Trust proxy**: Set `trustProxy: true` only when behind a reverse proxy; do not trust client-sent `X-Forwarded-*` without it.
- **Response headers**: Header values set from handler responses are sanitized (CRLF removed) to reduce response-splitting risk.
- **Validation**: `ValidationRule.pattern` (string) is compiled with `new RegExp`. Avoid complex or user-supplied patterns (ReDoS); prefer allowlists or simple character classes.
- **Dependencies**: Run `pnpm audit` (or `npm audit`) and keep `connect`, `serve-static`, `ws`, and other dependencies updated.
- **Logging**: Avoid logging full request body or headers in production.

[Security (full) →](./docs/guide/security.md) · [Configuration →](./docs/guide/configuration.md) · [Production →](./docs/guide/production-deploy.md)

---

## Links

- [Documentation](./docs/) — [view online](https://martinsbicudo.github.io/vitek-plugin/) · guides, API reference, configuration, examples
- [OpenAPI / Swagger + AsyncAPI](./docs/guide/openapi.md) — Auto-generate API docs (REST + WebSockets)
- [Plugin API](./docs/guide/plugin-api.md) — Extend Vitek with `afterTypesGenerated` and `beforeApiRequest` hooks
- [Alias](./docs/guide/alias.md) — Use `resolve.alias` for stable import paths
- [Introspection](./docs/guide/introspection.md) — Programmatic API: `getRoutes`, `getSockets`, `vitek-manifest.json`
- [Bundle size](./docs/guide/bundle-size.md) — Plugin and generated bundles (vitek-api.mjs); tree-shaking, heavy imports
- [Examples](./examples/) — socket-only, basic-js, js-react, typescript-react, import-external, api-docs, prisma, docker
- [GitHub](https://github.com/martinsbicudo/vitek-plugin)
- [NPM](https://www.npmjs.com/package/vitek-plugin)
- [License](LICENSE)
