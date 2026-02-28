# Vitek Docker Example

TypeScript + React example (same as typescript-react) runnable with Docker and docker-compose. Uses **pnpm** for install and scripts. No database.

## Run locally (dev)

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173.

## Run with Docker (dev)

From this directory, first pack the vitek-plugin and then build/run:

```bash
./prepare-docker.sh
docker compose up --build
```

Or use the wrapper script:

```bash
./run-docker.sh
```

`prepare-docker.sh` builds the vitek-plugin at the repo root and creates a `.tgz` tarball in this directory. Docker uses `package.docker.json` (which references the tarball) so the container does not need access to the monorepo. Open http://localhost:5173.

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
