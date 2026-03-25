export const PLUGIN_API_URI = 'vitek://docs/plugin-api';

export const PLUGIN_API_CONTENT = `# Vitek – Plugin API

External plugins via \`plugins\` option. Type: \`VitekPlugin\`.

## Hooks

### afterTypesGenerated(ctx)

Called after types, services, and OpenAPI are generated. \`ctx\`: \`root\`, \`schema\` (RouteSchema[]), \`sockets\` (ParsedSocket[]), \`apiBasePath\`, \`socketBasePath\`. Use for codegen or integrations.

### beforeApiRequest(ctx)

Called before each API request. \`ctx\`: \`req\`, \`res\`, \`path\`, \`method\`, \`next()\`. Call \`next()\` to continue; send response and omit \`next()\` to short-circuit (e.g. auth, rate limit).

\`\`\`typescript
const authPlugin: VitekPlugin = {
  name: "auth",
  async beforeApiRequest({ req, res, path, next }) {
    if (path.startsWith("/admin/") && !req.headers.authorization) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }
    next();
  },
};
\`\`\`

Import types: \`VitekPlugin\`, \`AfterTypesGeneratedContext\`, \`BeforeApiRequestContext\` from "vitek-plugin".
`;
