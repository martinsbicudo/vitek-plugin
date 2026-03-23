# Alias

Vitek supports `resolve.alias` via the `alias` option, merging your aliases into Vite's config. Alias imports are resolved by the `resolveId` hook (including in SSR during dev) and when building the API bundle (`vitek-api.mjs`), so you can use alias imports in route files in both development and production, including when running in Docker.

## When to use alias vs relative imports

**Use `alias` when:**
- You want stable paths (e.g. `@lib/db`) that do not change when you move files
- Your tooling (IDE, linters) works better with aliases
- You prefer `import { x } from '@lib/utils'` over `import { x } from '../../lib/utils'`

**Use relative imports (default) when:**
- You prefer simple `../lib/utils` and let the transform rewrite them
- Your project structure is shallow and relative paths are manageable
- You want to avoid configuring aliases

Both approaches work with Vitek's transform and resolveId. The transform rewrites relative imports in `srcDir` to root-relative paths; aliases are resolved by Vite before the transform runs.

## Configuration

Pass `alias` in your Vite config:

```typescript
import { vitek } from "vitek-plugin/plugin";

export default defineConfig({
  plugins: [
    vitek({
      alias: {
        "@lib": "src/lib",
        "@shared": "src/shared",
        "@api": "src/api",
      },
    }),
  ],
});
```

Values are resolved relative to the project root. Absolute paths are used as-is.

## Example

**vite.config.ts:**
```typescript
vitek({
  alias: { "@lib": "src/lib" },
})
```

**src/api/users/[id].get.ts:**
```typescript
import { getUser } from "@lib/db";

export default async function handler(ctx) {
  const user = await getUser(ctx.params.id);
  return user ?? null;
}
```

## Alias vs transform

| Aspect        | Alias                    | Transform (relative imports)       |
|---------------|--------------------------|------------------------------------|
| Configuration | Requires `alias` option  | None (built-in)                    |
| Import style  | `@lib/utils`             | `../../lib/utils`                  |
| Path stability| Stable when moving files | Paths change with file location    |
| Tooling       | Needs tsconfig paths     | Works out of the box               |

If you use aliases, add matching `paths` in `tsconfig.json` for TypeScript:

```json
{
  "compilerOptions": {
    "paths": {
      "@lib/*": ["./src/lib/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```
