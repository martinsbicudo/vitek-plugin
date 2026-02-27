# Vitek Docker Example

TypeScript + React example (same as typescript-react) runnable with Docker and docker-compose. Uses **pnpm** for install and scripts. No database.

## Run locally (dev)

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173.

## Run with Docker (dev)

From this directory:

```bash
docker compose up --build
```

The container uses **pnpm** to install dependencies and start the dev server. Open http://localhost:5173.

No need to build the plugin from the repo root—this example depends on the published `vitek-plugin` from npm. **Note:** The production `start` script uses the `vitek-serve` bin; the published package is expected to include the CLI (`dist/cli/serve.js`). For local testing with a linked plugin, use `"vitek-plugin": "file:../.."` and run `pnpm build` at the plugin root.

## Production (local)

Build the app (produces `dist/` including `vitek-api.mjs` and `vitek.config.mjs`), then run the production server (vitek-serve):

```bash
pnpm run build
pnpm run start
```

Open http://localhost:5173 (this example's start script uses port 5173).

This example is set up for production behind a reverse proxy:
- **trustProxy:** `vite.config.ts` uses `vitek({ trustProxy: true })` so the API sees the correct client IP and URL from `X-Forwarded-*` headers.
- **vitek-serve:** The `start` script runs with `--trust-proxy`; use it when the app is behind nginx, Caddy, or another proxy.
- **Production config:** `vitek.config.mjs` in the project root is copied to `dist/` during build. It exports `beforeApiRequest` (logging) and `onError` (503 JSON). See [Production server](https://vitek.dev/guide/production-server#production-config-vitekconfigmjs) in the docs.

## Production with Docker

From this directory, build and run the production image:

```bash
docker compose -f docker-compose.prod.yml up --build
```

The container runs `vite build` then serves the app and API via **vitek-serve**. Open http://localhost:5173.

This uses [Dockerfile.prod](./Dockerfile.prod) and [docker-compose.prod.yml](./docker-compose.prod.yml). No source volume is mounted; the image is self-contained.
