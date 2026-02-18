# File Structure

## Naming Convention

Files follow the pattern: `[name].[method].ts` or `[name].[method].js`

```
src/api/
  ├── middleware.ts              # Global middleware (optional)
  ├── health.get.ts              # GET /api/health
  ├── users/
  │   ├── middleware.ts          # Middleware for /api/users/*
  │   ├── [id].get.ts            # GET /api/users/:id
  │   ├── [id].put.ts            # PUT /api/users/:id
  │   └── [id]/
  │       ├── middleware.ts      # Middleware for /api/users/:id/*
  │       └── posts.get.ts        # GET /api/users/:id/posts
  └── posts/
      ├── index.get.ts           # GET /api/posts
      ├── index.post.ts          # POST /api/posts
      ├── [id].get.ts            # GET /api/posts/:id
      └── [...ids].get.ts        # GET /api/posts/*ids (catch-all)
```

## Dynamic Parameters

- **Single parameter**: `[id].get.ts` → `:id`
  - Example: `users/[id].get.ts` → `/api/users/:id`
- **Catch-all**: `[...ids].get.ts` → `*ids`
  - Example: `posts/[...ids].get.ts` → `/api/posts/*ids`
  - Captures: `/api/posts/1/2/3` → `params.ids = "1/2/3"`

## Supported HTTP Methods

All HTTP methods are supported through file extension:

| Extension   | Method  |
|------------|---------|
| `.get.ts`  | GET     |
| `.post.ts` | POST    |
| `.put.ts`  | PUT     |
| `.patch.ts`| PATCH   |
| `.delete.ts` | DELETE |
| `.head.ts` | HEAD    |
| `.options.ts` | OPTIONS |

Same applies for `.js` files (e.g. `health.get.js`).
