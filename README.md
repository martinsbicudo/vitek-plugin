<div align="center">
  <img src="./docs/public/logo.webp" alt="Vitek Plugin Logo" width="200" height="200" />
  
  # Vitek Plugin
  
  **File-based HTTP API generation for Vite**
  
  [![Version](https://img.shields.io/badge/version-0.1.1--beta-orange.svg)](https://github.com/martinsbicudo/vitek-plugin)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Vite](https://img.shields.io/badge/vite-^5.0.0-646CFF.svg)](https://vitejs.dev/)
  
  > **Beta Version**: This project is currently in beta. APIs may change in future releases.
</div>

---

Vitek is a Vite plugin that turns a folder of files into an HTTP API.

**Note:** The API runs with the Vite **development server** (`npm run dev` / `pnpm dev`). For **production**, run `vite build` then **vitek-serve** (e.g. `npx vitek-plugin serve` or add `"start": "vitek-serve"` and run `pnpm start`)—this serves both static assets and the API from one process. `vite preview` is for quick local preview of the static build only; for static + API use vitek-serve. Set `buildApi: false` if you do not want the API in build/production. Write endpoints as `[name].[method].ts` (or `.js`) under `src/api`, and get automatic routing, type generation, and typed client helpers.

**Full documentation:** [docs/](./docs/) · [View online](https://martinsbicudo.github.io/vitek-plugin/) (VitePress — run `npm run docs:dev` or `pnpm docs:dev` to view locally).

**Examples:** [examples/](./examples/) — `basic-js`, `js-react`, `typescript-react`, and `docker`.

---

## Quick Start

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

## Links

- [Documentation](./docs/) — [view online](https://martinsbicudo.github.io/vitek-plugin/) · guides, API reference, configuration, examples
- [Examples](./examples/) — basic-js, js-react, typescript-react, docker
- [GitHub](https://github.com/martinsbicudo/vitek-plugin)
- [NPM](https://www.npmjs.com/package/vitek-plugin)
- [License](LICENSE)
