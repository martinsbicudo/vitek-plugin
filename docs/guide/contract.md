# Contract snapshot and drift check

Compare the **generated OpenAPI** (and **AsyncAPI** when you have socket routes) against a committed baseline to catch breaking doc/API drift in CI.

## Requirements

- Route files under your API directory (default `src/api`, overridable via `vitek.mcp.json` `apiDir`).
- Same `apiBasePath` and `socketBasePath` as in `vitek.mcp.json` (defaults: `/api`, `/api/ws`).

## Commands

```bash
pnpm exec vitek contract snapshot
pnpm exec vitek contract check --fail-on=error
```

From the project root (or pass `--root`).

### `vitek contract snapshot`

Writes:

- `.vitek/contract/openapi.snapshot.json`
- `.vitek/contract/asyncapi.snapshot.json` (only if you have `.socket.ts` / `.socket.js` routes)

If socket routes are removed, the AsyncAPI snapshot file is deleted on the next snapshot.

### `vitek contract check`

Loads the snapshot files, regenerates specs from the filesystem (same rules as OpenAPI generation in dev/build), and prints a **Contract Drift Report**.

| Flag | Description |
| --- | --- |
| `--root=DIR` | Project root (default: current directory) |
| `--api-dir=PATH` | Relative API directory (default: from `vitek.mcp.json` or `src/api`) |
| `--fail-on=error` | Exit code `1` only when there are **error** severities (default) |
| `--fail-on=warning` | Exit code `1` on any issue (errors or warnings) |

Exit codes:

- `0` — no issues (for the chosen `--fail-on` threshold)
- `1` — drift detected
- `2` — OpenAPI snapshot missing (run `snapshot` first)

## Severity

| Severity | Examples |
| --- | --- |
| **error** | Removed path or method, removed response status, response body schema change, removed WebSocket channel, AsyncAPI channel shape change |
| **warning** | New operation not in baseline, new response status, new WebSocket channel, AsyncAPI baseline missing while sockets exist |

## GitHub Actions

Commit `.vitek/contract/*.json` after `contract snapshot`, then add a job:

```yaml
name: Contract
on: [push, pull_request]
jobs:
  contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx vitek contract check --fail-on=error
```

Use `pnpm exec` or `yarn` as needed. Ensure `vitek-plugin` is a dependency so `vitek` is on `PATH` via `npx` or `pnpm exec`.

## Notes

- The [minimal-ts example](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/minimal-ts) commits `openapi.snapshot.json` and runs `vitek contract check` in its test script.
- Drift compares **generated** specs (patterns, types from route files, JSDoc), not live HTTP traffic.
- `features.contracts` in `vitek.platform.json` is reserved for future tooling; the CLI is always available.
