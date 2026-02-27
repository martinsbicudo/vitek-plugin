# vitek-mcp

MCP server for [Vitek](https://github.com/martinsbicudo/vitek-plugin). Exposes Vitek docs and tools so AIs can build and modify backends with Vitek.

## Resources

- `vitek://docs/routing` – File naming, patterns (`[id]`, `[...rest]`), examples
- `vitek://docs/context` – `VitekContext`, `VitekRequest`
- `vitek://docs/response` – Response helpers, `VitekResponse`
- `vitek://docs/middlewares` – Global and hierarchical middlewares
- `vitek://docs/websockets` – File-based socket routes, `VitekSocketContext`
- `vitek://docs/validation` – `validateBody`, `validateQuery`, `ValidationRule`
- `vitek://docs/errors` – HTTP error classes, `onError`
- `vitek://docs/plugin-api` – `VitekPlugin`, `afterTypesGenerated`, `beforeApiRequest`
- `vitek://docs/configuration` – `VitekOptions` reference
- `vitek://docs/introspection` – `getManifest`, `getRoutes`, `getSockets`, `writeManifest`

## Tools

- **vitek_create_route** – `path`, `method`, optional `apiDir`. Returns file path and handler snippet.
- **vitek_create_middleware** – `basePattern` (e.g. `users` or empty for global), optional `apiDir`. Returns file path and middleware snippet.
- **vitek_create_socket** – `pattern` (e.g. `chat` or `rooms/[id]`), optional `apiDir`. Returns file path and socket handler snippet.
- **vitek_suggest_vite_config** – Optional `openApi`, `cors`, `apiDir`, `apiBasePath`, `socketsPath`. Returns `vite.config.ts` snippet.
- **vitek_validate_convention** – `filePath`, optional `apiDir`. Returns whether the path is a valid route, middleware, or socket file and its method/pattern.

## Install

```bash
npm install vitek-mcp
# or
pnpm add vitek-mcp
```

## Cursor

1. Open Cursor Settings → MCP (or `.cursor/mcp.json`).
2. Add a server entry:

```json
{
  "mcpServers": {
    "vitek": {
      "command": "npx",
      "args": ["-y", "vitek-mcp"]
    }
  }
}
```

If you installed locally in the project:

```json
{
  "mcpServers": {
    "vitek": {
      "command": "pnpm",
      "args": ["exec", "vitek-mcp"]
    }
  }
}
```

3. Restart Cursor or reload MCP. The AI can then read the Vitek resources and call `vitek_create_route` when you ask it to add or change routes.

## Claude Desktop

In the config file (e.g. `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "vitek": {
      "command": "npx",
      "args": ["-y", "vitek-mcp"]
    }
  }
}
```

## Run from repo

From this package directory:

```bash
pnpm run build
node dist/index.js
```

Or from the monorepo root (with workspace link):

```bash
pnpm --filter vitek-mcp exec node dist/index.js
```

## License

MIT
