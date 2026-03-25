export const ROUTING_URI = 'vitek://docs/routing';

export const ROUTING_CONTENT = `# Vitek – Routing

Route handlers receive a \`VitekContext\` and return a plain object or a response from response helpers.

## File naming

- \`[name].[method].ts\` or \`.js\` under the API directory (default \`src/api\`).
- Method: get, post, put, patch, delete, head, options.
- Dynamic segment: \`[id]\` → one segment (\`users/[id].get.ts\` → pattern \`users/:id\`).
- Catch-all: \`[...ids]\` → rest of path (\`posts/[...ids].get.ts\` → pattern \`posts/*ids\`).
- Index route: \`index.get.ts\` or \`folder/index.post.ts\` for directory index.

## Examples

Simple GET: \`src/api/health.get.ts\`
\`\`\`typescript
import type { VitekContext } from "vitek-plugin";
export default function handler(context: VitekContext) {
  return { status: "ok", timestamp: new Date().toISOString() };
}
\`\`\`

Dynamic param: \`src/api/users/[id].get.ts\`
\`\`\`typescript
import type { VitekContext } from "vitek-plugin";
export default async function handler(context: VitekContext) {
  const { params } = context;
  return { id: params.id, name: \`User \${params.id}\` };
}
\`\`\`

POST with body: \`src/api/posts/index.post.ts\`
\`\`\`typescript
import type { VitekContext } from "vitek-plugin";
export type Body = { title: string; content: string; authorId: number };
export default async function handler(context: VitekContext) {
  const { body } = context;
  return { message: "Post created", post: { id: Math.random(), ...body } };
}
\`\`\`

## Config

- \`apiDir\`: directory for route files (default \`src/api\`).
- \`apiBasePath\`: URL prefix (default \`/api\`).
`;
