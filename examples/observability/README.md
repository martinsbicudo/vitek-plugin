# Observability example

Minimal TypeScript app showing **`vitek.platform.json`** with `features.observability` and `features.issueDispatch`, plus route-level **`withSpan`** from `vitek-plugin/observability`.

## What to try

1. From repo root: `pnpm build` (plugin), then here: `pnpm i` and `pnpm dev`.
2. Call `GET /api/health` with header `X-Request-Id: my-correlation` — response JSON includes `requestId`, and the response echoes the header when valid.
3. Call `GET /api/demo` — handler uses `withSpan` (stub span until a real tracer is integrated).

Structured request logs appear in the dev terminal when observability is enabled.

## References

- [Observability guide](../../docs/guide/observability.md)
- [AI Platform Config](../../docs/guide/ai-platform-config.md)
