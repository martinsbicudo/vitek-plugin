# Middlewares

Middlewares run before (and optionally after) route handlers. They are applied hierarchically based on folder structure.

## Global Middleware

Create `src/api/middleware.ts` to apply middlewares to all routes:

```typescript
// src/api/middleware.ts
import type { Middleware } from "vitek-plugin";

export default [
  async (context, next) => {
    // Executes before the route
    console.log(`[Global] ${context.method} ${context.path}`);

    await next(); // Continues to next middleware/handler

    // Executes after the route
    console.log(`[Global] Completed ${context.path}`);
  },
] satisfies Middleware[];
```

### Optional path matcher for global middleware

By default, the root `middleware.ts` applies to **all** routes. To limit it to specific paths, export a `config` object with `path` (array of patterns):

```typescript
// src/api/middleware.ts
import type { Middleware } from "vitek-plugin";

export const config = {
  path: ["/api/protected/*", "/api/admin"], // only these routes
};

export default [
  async (context, next) => {
    // e.g. auth check
    await next();
  },
] satisfies Middleware[];
```

Patterns are relative to the API base (you can use `/api/protected/*` or `protected/*`). Use `*` as a suffix to match a prefix (e.g. `protected/*` matches `protected`, `protected/1`, `protected/1/2`). Without `config`, the global middleware applies to every route.

## Hierarchical Middleware by Folder

Middlewares are applied hierarchically based on folder structure.

**Posts middleware** (applies to `/api/posts`, `/api/posts/:id`, `/api/posts/:id/comments`, etc.):

```typescript
// src/api/posts/middleware.ts
import type { Middleware } from "vitek-plugin";

export default [
  async (context, next) => {
    console.log(`[Posts Middleware] ${context.method} ${context.path}`);
    await next();
  },
] satisfies Middleware[];
```

**Post ID middleware** (applies to routes under `/api/posts/:id/`, e.g. `/api/posts/:id/comments`, but not `/api/posts`):

```typescript
// src/api/posts/[id]/middleware.ts
import type { Middleware } from "vitek-plugin";

export default [
  async (context, next) => {
    const postId = context.params.id;
    console.log(`[Post ID Middleware] Validating post ${postId}`);
    await next();
  },
] satisfies Middleware[];
```

## Middleware Execution Order

1. Global middleware (`src/api/middleware.ts`)
2. Folder-specific middleware (e.g. `src/api/posts/middleware.ts`)
3. Nested folder middleware (e.g. `src/api/posts/[id]/middleware.ts`)
4. Route handler
