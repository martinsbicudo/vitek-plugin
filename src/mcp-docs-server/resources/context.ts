export const CONTEXT_URI = 'vitek://docs/context';

export const CONTEXT_CONTENT = `# Vitek – Context and request

## VitekContext

Handlers receive a \`VitekContext\` with:

- \`url\`: full request URL
- \`method\`: HTTP method (lowercase)
- \`path\`: path relative to API base (e.g. \`/users/1\`)
- \`query\`: parsed query string (\`Record<string, string | string[]>\`)
- \`params\`: route params (e.g. \`{ id: "1" }\` for \`/users/[id]\`)
- \`headers\`: request headers (\`Record<string, string>\`)
- \`body\`: parsed body (when applicable)
- \`clientIp\`: client IP (when \`trustProxy: true\`)
- \`sockets\`: \`SocketEmitter\` for broadcasting to WebSocket clients (when available)

## VitekRequest

Minimal request shape used internally: \`url\`, \`method\`, \`headers\`, \`body?\`.

## Usage in handlers

\`\`\`typescript
import type { VitekContext } from "vitek-plugin";

export default async function handler(context: VitekContext) {
  const { params, query, body, headers } = context;
  const id = params.id;
  const limit = query.limit ? Number(query.limit) : 10;
  return { id, limit, body };
}
\`\`\`
`;
