# AI Platform Config

Vitek supports an optional project-level config file named `vitek.platform.json`.

This file is the foundation for AI-related and platform-level features. It is safe to add now even if advanced features are not enabled yet.

## File location

Create the file at your project root:

```txt
your-project/
  vitek.platform.json
```

## Example

```json
{
  "features": {
    "observability": false,
    "contracts": false,
    "mcpWriteTools": false,
    "issueDispatch": false,
    "dataGenerators": false,
    "doctor": false
  },
  "ai": {
    "enabled": false,
    "provider": "openai",
    "model": "gpt-4.1-mini",
    "mode": "off",
    "redaction": {
      "stripHeaders": ["authorization", "cookie"],
      "stripFields": ["password", "token", "secret"]
    }
  }
}
```

## Fields

| Field | Type | Description |
| --- | --- | --- |
| `features.observability` | `boolean` | When `true`: `X-Request-Id` on API responses, `context.requestId` in handlers, structured JSON request logs (dev/preview via Vite logger, `vitek-serve` via stdout), and `requestId` on `beforeApiRequest` |
| `features.contracts` | `boolean` | Reserved for future contract integrations; use `vitek contract snapshot` / `check` today (see [Contract drift](/guide/contract)) |
| `features.mcpWriteTools` | `boolean` | Enables MCP write-safe tools (`vitek_route_create`, `vitek_route_update`, `vitek_validation_suggest`, `vitek_test_generate`, `vitek_openapi_sync`) to allow `apply: true` + `dryRun: false` writes |
| `features.issueDispatch` | `boolean` | Enables issue event dispatch from runtime error paths (non-blocking, structured event payload) |
| `features.dataGenerators` | `boolean` | Enables data-layer generators when available |
| `features.doctor` | `boolean` | Enables doctor scoring/report features when available |
| `ai.enabled` | `boolean` | Turns AI analyzer flows on/off |
| `ai.provider` | `'openai' \| 'anthropic' \| 'local'` | AI provider to use |
| `ai.model` | `string` | Model name for AI analyzer |
| `ai.mode` | `'off' \| 'local-only' \| 'remote-redacted'` | AI execution mode |
| `ai.redaction.stripHeaders` | `string[]` | Header keys to redact |
| `ai.redaction.stripFields` | `string[]` | Payload fields to redact |

## Observability (`features.observability`)

With `"observability": true`:

- **Correlation:** Clients may send `X-Request-Id` (ASCII letters, digits, hyphens, max 128 chars). Invalid or missing values get a new UUID. The same id is echoed as `X-Request-Id` on the response and set on `context.requestId` for route handlers.
- **Logs:** One JSON object per request start and completion (`event`: `http.request.start` | `http.request.complete`, plus `method`, `path`, `status`, `durationMs`, `requestId`, `route` when known).
- **`vitek-serve`:** Reads `vitek.platform.json` from the current working directory (run the CLI from the project root).

## AI and `vitek doctor`

`vitek doctor --ai-analyze` uses the `ai` block:

- `ai.enabled`: enables/disables AI analyze flow
- `ai.mode`:
  - `off`: skip AI analysis
  - `local-only`: writes redacted payload to `.vitek/doctor/ai-input.redacted.json`
  - `remote-redacted`: baseline acknowledges remote mode but does not auto-send network requests by default
- `ai.redaction`: field/header redaction policy used before output

## Issue Dispatch (`features.issueDispatch`)

With `"issueDispatch": true`, runtime error paths emit structured issue events through a dispatcher:

- default dispatcher: console JSON
- optional outbound webhook via env vars:
  - `VITEK_ISSUE_WEBHOOK_URL`
  - `VITEK_ISSUE_WEBHOOK_AUTH` (optional `Authorization` header)
  - `VITEK_ISSUE_WEBHOOK_RETRIES` (default `2`)
  - `VITEK_ISSUE_WEBHOOK_BACKOFF_MS` (default `150`)

Dispatch is non-blocking for request handling. After retries are exhausted, the event goes to dead-letter handling (logged by runtime).

## Notes

- If `vitek.platform.json` is missing, Vitek uses safe defaults.
- Invalid config files fall back to defaults.
- AI remains optional and disabled by default.
