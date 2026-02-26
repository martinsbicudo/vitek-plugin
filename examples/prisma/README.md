# Prisma Example

REST API with Vitek, Prisma ORM, and SQLite. No framework—only file-based routes and Prisma for database access.

## Features

- Prisma ORM with SQLite
- REST API routes (GET/POST) with Vitek
- OpenAPI docs at `/api-docs.html`
- TypeScript

## Quick Start

```bash
pnpm install
pnpm db:push
pnpm dev
```

Then open:
- http://localhost:5173
- http://localhost:5173/api-docs.html
- http://localhost:5173/api/health
- http://localhost:5173/api/users

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/users | List all users |
| POST | /api/users | Create user (body: `{ email, name? }`) |
| GET | /api/users/:id | Get user by ID |

## Database Commands

```bash
pnpm db:generate   # Generate Prisma Client
pnpm db:push       # Sync schema to SQLite
pnpm db:migrate    # Run migrations
pnpm db:studio     # Open Prisma Studio
```

## Tech Stack

- TypeScript
- Vite
- Prisma (SQLite)
- Vitek Plugin
