# Imports

## Package subpath imports

You can import from specific subpaths to reduce bundle size and improve clarity:

```ts
import { vitek } from 'vitek-plugin/plugin'
import { json, ok, notFound } from 'vitek-plugin/response'
import { NotFoundError, ValidationError } from 'vitek-plugin/errors'
import { validateBody, validateQuery } from 'vitek-plugin/validation'
import { getManifest, getRoutes } from 'vitek-plugin/introspection'
import { createMockContext, runMiddlewareChain } from 'vitek-plugin/testing'
```

**Vite config** can import option types from the plugin entry (same types are on the main package):

```ts
import type { VitekOptions, CorsOptions } from 'vitek-plugin/plugin'
```

Types for handlers, middleware, plugins, and introspection usually come from the main package:

```ts
import type {
  VitekContext,
  VitekRequest,
  VitekResponse,
  RouteHandler,
  Middleware,
  Route,
  RouteMatch,
  ParsedRoute,
  ParsedSocket,
  RouteSchema,
  VitekSocketContext,
  VitekPlugin,
  AfterTypesGeneratedContext,
  BeforeApiRequestContext,
  VitekManifest,
  OpenApiOptions,
  OpenApiInfo,
  OpenApiServer,
  AsyncApiOptions,
  AsyncApiInfo,
} from 'vitek-plugin'
```

`CorsOptions` and `RouteSchema` are also available from `vitek-plugin` (and `CorsOptions` from `vitek-plugin/plugin`).

The barrel `vitek-plugin` remains the compatibility entry for route bundles and apps that prefer a single import.

**API route bundles** (`dist/vitek-api.mjs`) should keep importing from `vitek-plugin` (barrel) for helpers such as `ok` or `validateBody`, so the runtime does not depend on extra package resolution. Config and tests can use subpaths freely; example **post-build** Vitest suites resolve subpaths and, where relevant, assert **behavior** (handler return values, OpenAPI paths, rate-limit 429, validation 422, and similar)—not only that `dist/` exists.

From the repository root, **`pnpm run examples:test`** runs `examples/run-all-tests.sh`, which runs **`pnpm i --ignore-workspace`** in each example before tests so a `file:../..` dependency picks up the current plugin `dist`. For a full **build + install + test** pass per example, use **`pnpm run examples:build-and-test`**.

---

## Relative imports

The vitek-plugin automatically handles relative imports (`./` and `../`) in files under `src/`, so routes and sockets can import shared code outside the API directory.

## How it works

Files in `src/api/` (and any file under `src/`) can import relative modules that lie **inside the project root**. The plugin:

1. **resolveId** — Resolves relative imports in API files to the correct absolute path (including extension fallback `.ts`, `.js`, etc.).
2. **transform** — Rewrites relative imports in files under `src/` to root-relative paths (`/src/lib/...`) so Vite resolves them correctly in dev and build.

## Recommended structure

```
src/
  ├── api/                    # Routes (default apiDir)
  │   ├── health.get.ts
  │   ├── users/
  │   │   └── [id].get.ts
  │   └── posts/
  │       └── index.post.ts
  ├── lib/                    # Shared utilities
  │   ├── db.ts
  │   └── auth.ts
  └── shared/                 # Code shared between api and frontend
      └── types.ts
```

## Examples

### Importing lib inside the project

**src/api/users/[id].get.ts:**
```ts
import { getUser } from '../../lib/db';
import type { User } from '../../shared/types';

export default async function handler(ctx) {
  const user = await getUser(ctx.params.id);
  return user ?? null;
}
```

The import `../../lib/db` is rewritten to `/src/lib/db` and resolved correctly.

### Nested import

**src/api/posts/[id]/comments.get.ts:**
```ts
import { getComments } from '../../../lib/comments';
```

The import `../../../lib/comments` is also handled, as long as the resolved file is inside the project root.

## Limitations

- **Only inside the project** — Imports that resolve outside the project root (e.g. `../../../etc/passwd`) are **not** rewritten for security.
- **Only files under `src/` (or `srcDir`)** — The transform applies only to files under the source directory (default: `src/`). Use the `srcDir` option if your code lives elsewhere (e.g. `lib/` or `app/`). Files in `public/`, `node_modules/`, or outside `srcDir` are not processed.
- **Relative imports only** — npm package imports (e.g. `import vue from 'vue'`) are left unchanged.
- **Configurable apiDir** — If you set `apiDir` outside `src/` (e.g. `api/` at root), `resolveId` still helps imports in API files; the transform continues to apply to files under `src/` (where routes usually live).

## Alias vs transform

For stable paths (e.g. `@lib/utils` instead of `../../lib/utils`), use the [alias](/guide/alias) option. The alias is merged into Vite's resolve.alias; the transform still handles relative imports.

## Custom apiDir and srcDir

When `apiDir` is set (e.g. `apiDir: 'api'` with `api/` at root), `resolveId` still works for relative imports **inside** API files.

Use `srcDir` when your source code lives in another directory (e.g. `srcDir: 'lib'`). The transform applies to all files under `srcDir`, rewriting relative imports to root-relative paths.

## Troubleshooting

**Import not resolving:**
- Check that the relative path is correct and the file exists.
- Ensure the import target is inside the project root.
- In dev, Vite may cache; try restarting the server.

**Build fails with "module not found":**
- The API bundle uses esbuild with the rewritten paths. Ensure all relative imports point to existing files in the project.
