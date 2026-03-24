# Observability

## Request correlation (`vitek.platform.json`)

When `features.observability` is `true` in `vitek.platform.json`, the HTTP runtime:

- Echoes and validates `X-Request-Id`
- Sets `context.requestId` on route handlers
- Emits structured JSON request logs (dev / preview / `vitek-serve`)
- Passes `requestId` on `beforeApiRequest` hooks

See [AI Platform Config](/guide/ai-platform-config) for the full file shape and env behavior.

## Route-level helper: `withSpan`

The package exports `withSpan` for optional, route-scoped instrumentation. Today it runs your handler and exposes a **no-op span** (`setAttribute` is a safe stub). The API is stable so a future release can wire real tracing (for example OpenTelemetry) without changing call sites.

```ts
import { withSpan } from 'vitek-plugin/observability';
import type { VitekContext } from 'vitek-plugin';

export default async function handler(_ctx: VitekContext) {
  return withSpan('orders.get', async (span) => {
    span.setAttribute('scope', 'demo');
    return { ok: true };
  });
}
```

The same symbols are available from the main entry: `import { withSpan } from 'vitek-plugin'`.

## Example project

The repository includes [examples/observability](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/observability) with `vitek.platform.json` (observability and issue dispatch enabled) and a route that uses `withSpan`.
