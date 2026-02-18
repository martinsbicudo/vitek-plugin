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
| `buildApi` | `boolean` | `true` | Build the API bundle during `vite build` so the API runs in `vite preview` and in production. Set to `false` to skip (dev-only API) |
| `enableValidation` | `boolean` | `false` | Enable automatic request validation (manual validation is always available via helpers) |
| `logging` | `object` | `undefined` | Logging configuration |
| `logging.level` | `'debug' \| 'info' \| 'warn' \| 'error'` | `'info'` | Minimum log level to display |
| `logging.enableRequestLogging` | `boolean` | `false` | Log every HTTP request (method, path, status, duration) |
| `logging.enableRouteLogging` | `boolean` | `true` | Log when a route is matched |

## Preview and production

When `buildApi` is `true` (default), running `vite build` also produces an API bundle (`dist/vitek-api.mjs`). The API then runs in:

- **Preview:** Run `vite preview` after `vite build`; the preview server serves both static assets and the API at `/api/*`.
- **Production:** Use the same setup as preview: run `vite build`, then serve the app with `vite preview` or a Node server that serves the `dist` folder and loads the API bundle. See the main [README](https://github.com/martinsbicudo/vitek-plugin#readme) for the recommended production path.

Set `buildApi: false` if you only want the API in development and do not need it in preview or production.
