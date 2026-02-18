# Vitek Docker Example

TypeScript + React example (same as typescript-react) runnable with Docker and docker-compose. Uses **pnpm** for install and scripts. No database.

## Run with pnpm (local)

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173.

## Run with Docker

From this directory:

```bash
docker compose up --build
```

The container uses **pnpm** to install dependencies and start the dev server. Open http://localhost:5173.

No need to build the plugin from the repo root—this example depends on the published `vitek-plugin` from npm.
