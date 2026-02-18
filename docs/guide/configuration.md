# Configuration

## Plugin Options

Pass options to `vitek()` in your Vite config:

```typescript
import { vitek } from "vitek-plugin";

export default defineConfig({
  plugins: [
    vitek({
      apiDir: "src/api",
      apiBasePath: "/api",
      buildApi: true,
      enableValidation: false,
      logging: {
        level: "info",
        enableRequestLogging: false,
        enableRouteLogging: true,
      },
    }),
  ],
});
```

## Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiDir` | `string` | `'src/api'` | Directory where API route files are located (relative to project root) |
| `apiBasePath` | `string` | `'/api'` | Base path for all API routes |
| `buildApi` | `boolean` | `true` | Build the API bundle during `vite build` so the API runs with vitek-serve in production. Set to `false` to skip (dev-only API) |
| `enableValidation` | `boolean` | `false` | Enable automatic request validation (manual validation is always available via helpers) |
| `logging` | `object` | `undefined` | Logging configuration |
| `logging.level` | `'debug' \| 'info' \| 'warn' \| 'error'` | `'info'` | Minimum log level to display |
| `logging.enableRequestLogging` | `boolean` | `false` | Log every HTTP request (method, path, status, duration) |
| `logging.enableRouteLogging` | `boolean` | `true` | Log when a route is matched |

## Preview and production

When `buildApi` is `true` (default), running `vite build` also produces an API bundle (`dist/vitek-api.mjs`).

- **Production:** Run `vite build`, then **vitek-serve** (e.g. `npx vitek-plugin serve` or `pnpm start`). vitek-serve serves both static assets and the API at `/api/*` from a single Node process. See [Production server](/guide/production-server) for details.
- **Preview:** `vite preview` is optional for a quick local preview of the static build only; for static + API use vitek-serve.

Set `buildApi: false` if you only want the API in development.
