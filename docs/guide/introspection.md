# Introspection API

Vitek exposes a programmatic API to inspect routes, middlewares, and sockets, and generates a manifest file during build for integration with CLIs, IDEs, and other tooling.

## Programmatic API

### getManifest(root, apiDir)

Returns a full manifest with routes, middlewares, and sockets. Paths in the manifest are relative to `root`.

```typescript
import { getManifest } from "vitek-plugin";

const manifest = getManifest(process.cwd(), "src/api");
// {
//   routes: [{ method, pattern, params, file }],
//   middlewares: [{ basePattern, path }],
//   sockets: [{ pattern, params, file }]
// }
```

### getRoutes(root, apiDir)

Returns parsed route metadata.

```typescript
import { getRoutes } from "vitek-plugin";

const routes = getRoutes(process.cwd(), "src/api");
// ParsedRoute[]: { method, pattern, params, file }
```

### getSockets(root, apiDir)

Returns parsed socket metadata.

```typescript
import { getSockets } from "vitek-plugin";

const sockets = getSockets(process.cwd(), "src/api");
// ParsedSocket[]: { pattern, params, file }
```

### writeManifest(root, apiDir, outDir)

Writes `vitek-manifest.json` to the given output directory. Use for custom build scripts when not using the Vite plugin.

```typescript
import { writeManifest } from "vitek-plugin";

writeManifest(process.cwd(), "src/api", "dist");
// Writes dist/vitek-manifest.json
```

## Manifest format

The manifest file (`vitek-manifest.json`) is generated in the build output directory during `vite build` when `buildApi` is `true`. Format:

```json
{
  "routes": [
    {
      "method": "get",
      "pattern": "users/:id",
      "params": ["id"],
      "file": "src/api/users/[id].get.ts"
    }
  ],
  "middlewares": [
    {
      "basePattern": "",
      "path": "src/api/middleware.ts"
    }
  ],
  "sockets": [
    {
      "pattern": "chat",
      "params": [],
      "file": "src/api/chat.socket.ts"
    }
  ]
}
```

| Field | Description |
|-------|-------------|
| `routes` | HTTP route handlers: method, path pattern, param names, source file |
| `middlewares` | Middleware files: base pattern (empty for global), source file |
| `sockets` | WebSocket handlers: path pattern, param names, source file |

Paths are relative to the project root.

## Use cases

- **CLI tools** — Discover routes and sockets for codegen or validation
- **IDE integrations** — Provide navigation or autocomplete based on route metadata
- **CI/CD** — Verify expected routes exist or run tests per route
- **Documentation** — Generate custom docs from the manifest without parsing source files
