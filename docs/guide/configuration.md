# Configuration

## Plugin Options

Pass options to `vitek()` in your Vite config:

```typescript
import { vitek } from "vitek-plugin/plugin";

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

| Option                         | Type                                     | Default     | Description                                                                                                                                                                                                                                                |
| ------------------------------ | ---------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apiDir`                       | `string`                                 | `'src/api'` | Directory where API route files are located (relative to project root)                                                                                                                                                                                     |
| `srcDir`                       | `string`                                 | `'src'`     | Directory for relative import rewriting. The transform applies to files under this directory. Use when your source files live elsewhere (e.g. `'lib'`, `'app'`).                                                                                             |
| `apiBasePath`                  | `string`                                 | `'/api'`    | Base path for all API routes                                                                                                                                                                                                                               |
| `buildApi`                     | `boolean`                                | `true`      | Build the API bundle during `vite build` so the API runs with vitek-serve in production. Set to `false` to skip (dev-only API)                                                                                                                             |
| `enableValidation`             | `boolean`                                | `false`     | Enable automatic request validation (manual validation is always available via helpers)                                                                                                                                                                    |
| `openApi`                      | `boolean \| object`                     | `undefined` | Enable OpenAPI + AsyncAPI docs. `true` or `{}` for defaults; object for `info`, `servers`, `apiBasePath`. When sockets exist, also generates AsyncAPI and adds a WebSockets tab. See [OpenAPI / Swagger + AsyncAPI](/guide/openapi).                        |
| `sockets`                      | `boolean \| { path?: string }`           | `true`      | Enable WebSocket routes. Set to `false` to disable. Use `{ path: '/ws' }` to serve sockets at a custom path (default is `/api/ws`).                                                                                                                        |
| `logging`                      | `object`                                 | `undefined` | Logging configuration                                                                                                                                                                                                                                      |
| `logging.level`                | `'debug' \| 'info' \| 'warn' \| 'error'` | `'info'`    | Minimum log level to display                                                                                                                                                                                                                               |
| `logging.enableRequestLogging` | `boolean`                                | `false`     | Log every HTTP request (start `[METHOD] /path →` and end `[METHOD] /path 200 (5ms)`) and WebSocket events (`[WS] connected`, `[WS] disconnected`, `[WS] received`, `[WS] emitted`). See [WebSockets](/guide/websockets#logging-request-and-socket-events). |
| `logging.enableRouteLogging`   | `boolean`                                | `true`      | Log when a route is matched (debug level)                                                                                                                                                                                                                  |
| `onGenerationError`            | `(error: Error) => void`                 | `undefined` | Callback when types/services/OpenAPI generation fails. Use for error reporting (e.g. Sentry) or custom handling. See [Relative Imports](/guide/imports) for context.                                                                                         |
| `plugins`                      | `VitekPlugin[]`                          | `undefined` | External plugins for extensibility. See [Plugin API](/guide/plugin-api).                                                                                                                                                                                   |
| `alias`                        | `Record<string, string>`                 | `undefined` | Resolve aliases merged into Vite's resolve.alias and used when building the API bundle (e.g. `{ '@lib': 'src/lib' }`). See [Alias](/guide/alias).                                                                                                            |
| `cors`                         | `boolean \| CorsOptions`                 | `undefined` | Enable CORS for the API. `true` for permissive defaults (`*` origin, common methods). Use a `CorsOptions` object to restrict origin, methods, or headers. Applied in dev, preview, and when using `vitek-serve --cors`. |
| `trustProxy`                   | `boolean`                                | `false`     | When `true`, the API trusts `X-Forwarded-Proto`, `X-Forwarded-Host`, and `X-Forwarded-For` from the reverse proxy. Use when running behind nginx, Caddy, or similar. Context gets the effective URL and `clientIp`. In production with vitek-serve, use `vitek-serve --trust-proxy`. |
| `onError`                      | `(err, req, res) => void \| Promise<void>` | `undefined` | Custom error handler when a non-HttpError is thrown. You can send a custom response; if you do not call `res.end()`, the default 500 JSON is sent. See [Error handling](/guide/error-handling#custom-error-handler-onerror). In production, export from `dist/vitek.config.mjs`. |
| `issueDispatcher`              | `IssueDispatcher`                        | `undefined` | When `features.issueDispatch` is true in `vitek.platform.json`, replaces the default console / webhook issue sink. See [AI Platform Config](/guide/ai-platform-config#issue-dispatch-featuresissuedispatch) and [examples/issue-dispatch](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/issue-dispatch). |
| `maxBodySize`                  | `number`                                 | (default)   | Max request body size in bytes. Requests exceeding this return 413. In production, export from `dist/vitek.config.mjs` or use CLI. See [Security](/guide/security#request-body-limit). |

## CORS example

To allow cross-origin requests from a specific frontend:

```typescript
import type { CorsOptions } from "vitek-plugin/plugin";

const cors: CorsOptions = {
  origin: "https://myapp.example.com",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

vitek({ cors });
```

You can also use `import type { CorsOptions } from "vitek-plugin"`.

With `cors: true`, the API sends `Access-Control-Allow-Origin: *` and allows common methods and headers.

## Preview and production

When `buildApi` is `true` (default), running `vite build` also produces an API bundle (`dist/vitek-api.mjs`).

- **Production:** Run `vite build`, then **vitek-serve** (add `"start": "vitek-serve"` and run `pnpm start`). vitek-serve serves both static assets and the API at `/api/*` from a single Node process. See [Production server](/guide/production-server) for details.
- **Preview:** `vite preview` is optional for a quick local preview of the static build only; for static + API use vitek-serve.

Set `buildApi: false` if you only want the API in development.
