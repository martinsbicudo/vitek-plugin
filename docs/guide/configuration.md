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
| `enableValidation` | `boolean` | `false` | Enable automatic request validation (manual validation is always available via helpers) |
| `logging` | `object` | `undefined` | Logging configuration |
| `logging.level` | `'debug' \| 'info' \| 'warn' \| 'error'` | `'info'` | Minimum log level to display |
| `logging.enableRequestLogging` | `boolean` | `false` | Log every HTTP request (method, path, status, duration) |
| `logging.enableRouteLogging` | `boolean` | `true` | Log when a route is matched |
