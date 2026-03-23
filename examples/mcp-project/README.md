# mcp-project

Minimal example focused on `vitek mcp` for exposing project API metadata to MCP clients.

## What this example covers

- `vitek-plugin/plugin` in `vite.config.js`
- one HTTP route (`health.get.js`) and one socket route (`notify.socket.js`)
- optional MCP config via `vitek.mcp.json`
- post-build validation for:
  - generated bundles
  - subpath export resolution
  - manifest contents
  - `vitek mcp` startup smoke test

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
