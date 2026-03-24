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
| `features.mcpWriteTools` | `boolean` | Enables MCP write-safe tools when available |
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

## Notes

- If `vitek.platform.json` is missing, Vitek uses safe defaults.
- Invalid config files fall back to defaults.
- AI remains optional and disabled by default.
