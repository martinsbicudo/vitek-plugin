# MCP – Documentation & snippets

This server is **not** tied to a single Vitek project. It exposes **static** documentation (routing, context, validation, etc.) and **tools** that return file paths and code snippets for routes, middleware, sockets, and `vite.config` with `vitek()`.

Use it when you want an assistant to follow Vitek conventions without running your app.

## Command

```bash
vitek mcp-docs
```

Runs over **stdio**, same transport as `vitek mcp`.

## Cursor

```json
{
  "mcpServers": {
    "vitek-docs": {
      "command": "pnpm",
      "args": ["exec", "vitek", "mcp-docs"]
    }
  }
}
```

With `npx` (published package):

```json
{
  "mcpServers": {
    "vitek-docs": {
      "command": "npx",
      "args": ["-y", "vitek-plugin", "mcp-docs"]
    }
  }
}
```

## Difference from `vitek mcp`

| Command | Purpose |
|---------|---------|
| `vitek mcp` | Live project: manifest, OpenAPI, `vitek_api_call`, optional write tools |
| `vitek mcp-docs` | Static docs + snippet generators; no project server required |
