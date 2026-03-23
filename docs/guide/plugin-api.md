# Plugin API

Vitek supports external plugins via the `plugins` option. Plugins can hook into type generation and API request handling without modifying the core.

## Quick Start

```typescript
import { defineConfig } from "vite";
import { vitek } from "vitek-plugin/plugin";
import type { VitekPlugin } from "vitek-plugin";

const myPlugin: VitekPlugin = {
  name: "my-plugin",
  afterTypesGenerated(ctx) {
    console.log("Types generated for", ctx.schema.length, "routes");
  },
};

export default defineConfig({
  plugins: [vitek({ plugins: [myPlugin] })],
});
```

## Available Hooks

### `afterTypesGenerated`

Called after types, services, and optionally OpenAPI are generated. Useful for post-processing, code generation, or integrations with other tools.

```typescript
afterTypesGenerated?: (ctx: AfterTypesGeneratedContext) => void | Promise<void>;
```

**Context:**

| Property       | Type             | Description                                      |
| -------------- | ---------------- | ------------------------------------------------ |
| `root`         | `string`         | Project root directory                           |
| `schema`       | `RouteSchema[]`  | Route schema (pattern, method, params, file...)  |
| `sockets`      | `ParsedSocket[]` | Parsed WebSocket socket definitions              |
| `apiBasePath`  | `string`         | API base path (e.g. `/api`)                      |
| `socketBasePath` | `string`       | WebSocket base path (e.g. `/api/ws`)             |

**Example:**

```typescript
import * as fs from "fs/promises";
import * as path from "path";

const schemaLogger: VitekPlugin = {
  name: "schema-logger",
  async afterTypesGenerated({ root, schema, sockets }) {
    await fs.writeFile(
      path.join(root, "routes-summary.json"),
      JSON.stringify({ routes: schema.length, sockets: sockets.length }, null, 2)
    );
  },
};
```

---

### `beforeApiRequest`

Called before each API request. Call `next()` to continue to the route handler, or send a response and skip `next()` to short-circuit (e.g. auth, rate limiting).

```typescript
beforeApiRequest?: (ctx: BeforeApiRequestContext) => void | Promise<void>;
```

**Context:**

| Property | Type             | Description                                           |
| -------- | ---------------- | ----------------------------------------------------- |
| `req`    | `IncomingMessage`| Incoming HTTP request                                 |
| `res`    | `ServerResponse` | Response object (use to short-circuit)                |
| `path`   | `string`         | Path relative to API base (e.g. `/health`, `/users/1`)|
| `method` | `string`         | HTTP method (lowercase)                               |
| `next`   | `() => void`     | Call to continue; omit if you send a response         |

**Example – simple auth:**

```typescript
const authPlugin: VitekPlugin = {
  name: "auth",
  async beforeApiRequest({ req, res, path, next }) {
    if (path.startsWith("/admin/") && !req.headers.authorization) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return; // do not call next()
    }
    next();
  },
};
```

**Example – request logging:**

```typescript
const logPlugin: VitekPlugin = {
  name: "request-log",
  beforeApiRequest({ path, method, next }) {
    console.log(`${method} ${path}`);
    next();
  },
};
```

## Configuration

Add `plugins` to your Vitek options:

```typescript
vitek({
  apiDir: "src/api",
  plugins: [myPlugin, authPlugin],
});
```

## TypeScript Types

Import plugin types for type safety:

```typescript
import type {
  VitekPlugin,
  AfterTypesGeneratedContext,
  BeforeApiRequestContext,
} from "vitek-plugin";
```

---

## Recipes

### Rate limiting (in-memory by IP)

Rate limiting is not built into the core. You can implement it with a `beforeApiRequest` plugin that tracks requests per IP and short-circuits with 429 when a limit is exceeded.

**In-memory example (single process):**

```typescript
import type { IncomingMessage } from "http";
import type { VitekPlugin } from "vitek-plugin";
import { tooManyRequests } from "vitek-plugin/response";

const windowMs = 60_000;
const maxPerWindow = 100;
const store = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = typeof forwarded === "string" ? forwarded : forwarded[0];
    return first.split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

const rateLimitPlugin: VitekPlugin = {
  name: "rate-limit",
  beforeApiRequest({ req, res, path, next }) {
    const ip = getClientIp(req);
    const now = Date.now();
    let entry = store.get(ip);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(ip, entry);
    }
    entry.count++;
    if (entry.count > maxPerWindow) {
      res.statusCode = 429;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(tooManyRequests({ error: "Too many requests" }).body));
      return;
    }
    next();
  },
};
```

Use with `trustProxy: true` if the app is behind a proxy so `X-Forwarded-For` is used for the client IP.

**Production:** For production (multiple instances or persistence), use a shared store (e.g. Redis) or put rate limiting in a reverse proxy (nginx, Caddy, Cloudflare). The in-memory plugin above is suitable for development or single-instance deployments.
