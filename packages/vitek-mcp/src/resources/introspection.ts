export const INTROSPECTION_URI = 'vitek://docs/introspection';

export const INTROSPECTION_CONTENT = `# Vitek – Introspection API

Programmatic API to inspect routes, middlewares, and sockets. Manifest file generated at build.

## Functions (from vitek-plugin)

- \`getManifest(root, apiDir)\` – { routes, middlewares, sockets }
- \`getRoutes(root, apiDir)\` – ParsedRoute[] ({ method, pattern, params, file })
- \`getSockets(root, apiDir)\` – ParsedSocket[] ({ pattern, params, file })
- \`writeManifest(root, apiDir, outDir)\` – writes vitek-manifest.json

## Manifest format (vitek-manifest.json)

\`\`\`json
{
  "routes": [{ "method": "get", "pattern": "users/:id", "params": ["id"], "file": "src/api/users/[id].get.ts" }],
  "middlewares": [{ "basePattern": "", "path": "src/api/middleware.ts" }],
  "sockets": [{ "pattern": "chat", "params": [], "file": "src/api/chat.socket.ts" }]
}
\`\`\`

Paths relative to project root. Use for CLIs, IDEs, CI/CD, or custom docs.
`;
