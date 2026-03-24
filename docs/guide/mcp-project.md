# MCP – Project API

In a project that uses Vitek, you can expose that **project's API** (routes, sockets, manifest, OpenAPI, AsyncAPI) to AI assistants via **Model Context Protocol (MCP)**. The AI helping with the front-end or another service can then see endpoints and types without you pasting documentation manually.

## Command

From your project directory (where `vite.config` and the `src/api` folder live), run:

```bash
vitek mcp
```

This starts an MCP server over **stdio**. The server uses the current directory as the project root and reads the optional config from `vitek.mcp.json`.

## Configuration (optional)

Create `vitek.mcp.json` at the project root to adjust paths and base URL:

```json
{
  "apiDir": "src/api",
  "apiBasePath": "/api",
  "socketBasePath": "/api/ws",
  "baseUrl": "http://localhost:5173"
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `apiDir` | `src/api` | Directory for routes and sockets |
| `apiBasePath` | `/api` | HTTP API path prefix |
| `socketBasePath` | `/api/ws` | WebSocket path prefix |
| `baseUrl` | `http://localhost:5173` | Base URL used by the `vitek_api_call` tool |

If the file is missing, these defaults are used.

## Resources (read-only)

The server exposes the following resources:

| URI | Content |
|-----|---------|
| `vitek-api://manifest` | Full manifest (routes, middlewares, sockets) |
| `vitek-api://routes` | HTTP routes list (method, pattern, params, file) |
| `vitek-api://sockets` | Sockets list (pattern, params, file) |
| `vitek-api://openapi` | OpenAPI 3.0 spec generated from routes |
| `vitek-api://asyncapi` | AsyncAPI 2.x spec generated from sockets |

The AI can read these resources to discover your API surface.

## Tool (optional)

- **vitek_api_call** – Calls a local API endpoint. Parameters: `method`, `path` (relative to apiBasePath), `body` (optional), `headers` (optional).  
  **Requirement:** the API must be running (e.g. `pnpm dev` or `pnpm start`). The base URL is the one set in `baseUrl` in the config (or `http://localhost:5173`).

## Write-safe tools (opt-in)

`vitek mcp` also exposes write-safe tools for route iteration:

- `vitek_route_create`
- `vitek_route_update`
- `vitek_validation_suggest`
- `vitek_test_generate`
- `vitek_openapi_sync`

Safety model:

- `dryRun` defaults to `true`
- write is blocked unless both `apply: true` and `dryRun: false`
- write is blocked unless `features.mcpWriteTools` is `true` in `vitek.platform.json`

Each tool returns:

- `diff` (unified preview)
- `risk` notes
- `next` guidance for confirmation/apply flow

## Cursor

1. In a Vitek project, create or edit `.cursor/mcp.json` (or Settings → MCP).
2. Add the server pointing to the `vitek mcp` command in the project directory:

```json
{
  "mcpServers": {
    "vitek-api": {
      "command": "pnpm",
      "args": ["exec", "vitek", "mcp"]
    }
  }
}
```

If you use `npx` instead of `pnpm`:

```json
{
  "mcpServers": {
    "vitek-api": {
      "command": "npx",
      "args": ["-y", "vitek-plugin", "mcp"]
    }
  }
}
```

3. Restart Cursor or reload MCP. The AI will then be able to read the `vitek-api://*` resources and, if the API is running, use the `vitek_api_call` tool.

## Claude Desktop

In the Claude config file (e.g. `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS), add:

```json
{
  "mcpServers": {
    "vitek-api": {
      "command": "pnpm",
      "args": ["exec", "vitek", "mcp"]
    }
  }
}
```

Start Claude Desktop from your Vitek project directory (or set `cwd` as per Claude’s documentation).

## Summary

- **Command:** `vitek mcp` (from the project directory).
- **Config:** `vitek.mcp.json` (optional).
- **Resources:** manifest, routes, sockets, openapi, asyncapi.
- **Tool:** `vitek_api_call` (requires the API to be running).
- **Usage:** configure the MCP client (Cursor, Claude Desktop) to run `vitek mcp` in the project cwd.
- **Example:** `examples/mcp-project`.
