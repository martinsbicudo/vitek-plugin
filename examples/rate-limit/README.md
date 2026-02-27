# Rate Limit Example

Minimal example demonstrating in-memory rate limiting via a `beforeApiRequest` plugin.

## Features

- **Rate limit plugin:** Limits each IP to 10 requests per 60 seconds. Excess requests receive 429 Too Many Requests.
- **Single route:** `GET /api/health` returns `{ status: 'ok', timestamp }`.

## Run

```bash
pnpm install
pnpm run build
pnpm test
pnpm start
```

Then open http://localhost:3000. Call `GET /api/health` repeatedly; after 10 requests in a minute you get 429.

## Docs

See [Plugin API – Recipes (rate limiting)](../../docs/guide/plugin-api.md#rate-limiting-in-memory-by-ip) for the pattern and production options (Redis, proxy).
