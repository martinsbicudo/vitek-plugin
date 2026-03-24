# Data Generators

Vitek includes a baseline generator command for CRUD scaffolding.

## Command

```bash
vitek generate crud User --adapter prisma --out src/api/users
```

Options:

- `--adapter prisma|drizzle|sql`
- `--out <path>` output directory
- `--root <path>` project root

## Generated output

For Prisma adapter, Vitek generates:

- `index.get.ts`
- `index.post.ts`
- `[id].get.ts`
- `[id].patch.ts`
- `[id].delete.ts`
- `crud.generated.test.ts`
- `crud.contract.test.ts`

The generated handlers include:

- response helpers (`ok`, `created`, `notFound`, `noContent`)
- validation scaffolding (`validateQuery`, `validateBody`)
- OpenAPI JSDoc tags (`@summary`, `@tag`)

## Adapter notes

- `prisma`: full baseline CRUD scaffold
- `drizzle`: template scaffold
- `sql`: template scaffold
