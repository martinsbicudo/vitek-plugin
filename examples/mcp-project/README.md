# mcp-project

Minimal example focused on `vitek mcp` for exposing project API metadata to MCP clients.

## What this example covers

- `vitek.platform.json` with `features.mcpWriteTools: true` (required for MCP apply writes)
- `vitek-plugin/plugin` in `vite.config.js`
- one HTTP route (`health.get.js`) and one socket route (`notify.socket.js`)
- optional MCP config via `vitek.mcp.json`
- post-build validation for:
  - generated bundles
  - subpath export resolution
  - manifest contents
  - `vitek mcp` startup smoke test
- MCP write-safe tools registration (`vitek_route_create`, `vitek_route_update`, `vitek_validation_suggest`, `vitek_test_generate`, `vitek_openapi_sync`)

## Run

From this folder:

```bash
pnpm install
pnpm run build
pnpm test
```

To start MCP server manually:

```bash
pnpm run mcp
```

## Write-safe tools

This example also supports the write-safe MCP tools exposed by `vitek mcp`.

By default, tool calls run with `dryRun: true` and only return:

- `diff`
- `risk`
- `next`

To actually write files, calls must include:

- `apply: true`
- `dryRun: false`

This repo ships that file in this folder; adjust flags as needed for your fork.
