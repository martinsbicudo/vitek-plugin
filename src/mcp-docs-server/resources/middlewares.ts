export const MIDDLEWARES_URI = 'vitek://docs/middlewares';

export const MIDDLEWARES_CONTENT = `# Vitek – Middlewares

Middlewares run before (and optionally after) route handlers. Applied hierarchically by folder.

## Global middleware

\`src/api/middleware.ts\` – applies to all routes. Export default array of \`Middleware\` (async (context, next) => ...). Call \`await next()\` to continue.

\`\`\`typescript
import type { Middleware } from "vitek-plugin";

export default [
  async (context, next) => {
    console.log(context.method, context.path);
    await next();
  },
] satisfies Middleware[];
\`\`\`

Optional \`config.path\`: array of patterns (e.g. \`["protected/*", "admin"]\`) to limit global middleware to those paths. Use \`*\` suffix for prefix match.

## Hierarchical middleware

- \`src/api/posts/middleware.ts\` – applies to \`/api/posts\`, \`/api/posts/:id\`, etc.
- \`src/api/posts/[id]/middleware.ts\` – applies to routes under \`/api/posts/:id/\` (e.g. \`/api/posts/1/comments\`).

Same signature: \`(context, next) => Promise<void>\`, call \`await next()\`.

## Order

1. Global (\`src/api/middleware.ts\`)
2. Folder (\`src/api/posts/middleware.ts\`)
3. Nested (\`src/api/posts/[id]/middleware.ts\`)
4. Route handler
`;
