# Vitek TypeScript + React Example

Complete example demonstrating the use of Vitek with TypeScript and React. This example shows all advanced features of the plugin, including automatic TypeScript type generation, hierarchical middlewares, and usage of generated services with complete type-safety.

## Features

- ✅ **Complete TypeScript**: All routes and components in TypeScript
- ✅ **End-to-end type-safety**: Types automatically generated for all routes
- ✅ **React**: React interface demonstrating usage of generated services
- ✅ **Hierarchical middlewares**: Examples of global and per-folder middlewares
- ✅ **All HTTP methods**: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- ✅ **Dynamic parameters**: Examples with `[id]` and `[...ids]` (catch-all)
- ✅ **Typed Body and Query**: Demonstration of types for body and query parameters
- ✅ **Response helpers**: Examples of custom status codes and headers
- ✅ **Error handling**: HTTP error classes with automatic status mapping
- ✅ **Request validation**: Validation helpers for body and query parameters

## Structure

```
src/
  ├── api/                    # API file-based
  │   ├── middleware.ts       # Global middleware
  │   ├── health.get.ts       # GET /api/health
  │   ├── users/
  │   │   ├── middleware.ts   # Middleware for /api/users/*
  │   │   ├── [id].get.ts     # GET /api/users/:id
  │   │   ├── [id].post.ts    # POST /api/users/:id
  │   │   └── [id]/
  │   │       └── middleware.ts # Middleware for /api/users/:id/*
  │   └── posts/
  │       ├── middleware.ts   # Middleware for /api/posts/*
  │       ├── index.get.ts     # GET /api/posts
  │       ├── index.post.ts    # POST /api/posts (with Body type)
  │       ├── [id].get.ts      # GET /api/posts/:id
  │       └── [...ids].get.ts  # GET /api/posts/*ids (catch-all)
  ├── api.types.ts            # Automatically generated types
  ├── api.services.ts          # Automatically generated services
  ├── App.tsx                  # Main React component
  └── main.tsx                 # Entry point
```

## Installation

**Important**: Before installing the example dependencies, you need to build the plugin at the project root:

```bash
# At the project root (vitek-plugin/)
cd ../..
npm run build
# or
pnpm build

# Then, in the example directory
cd examples/typescript-react
npm install
# or
pnpm install
```

## Development

```bash
npm run dev
# or
pnpm dev
```

Visit `http://localhost:5173` to see the application with endpoint documentation.

## Endpoints Demonstrated

- `GET /api/health` - Health check
- `GET /api/users/:id` - Get user by ID
- `POST /api/users/:id` - Create user
- `PUT /api/users/:id` - Update user (complete)
- `PATCH /api/users/:id` - Update user (partial)
- `DELETE /api/users/:id` - Delete user
- `GET /api/posts` - List posts (with query params)
- `POST /api/posts` - Create post (with Body type)
- `GET /api/posts/:id` - Get post by ID
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `GET /api/posts/*ids` - Get multiple posts (catch-all)
- `GET /api/comments/:postId/:commentId` - Routes with multiple parameters

## How to Use the Endpoints

### Using Generated Services (Recommended)

Vitek automatically generates typed functions in `src/api.services.ts`:

```typescript
import { getHealth, getUsersById, getPosts, postPosts } from './api.services';

// GET /api/health
const health = await getHealth();

// GET /api/users/:id (with type-safety)
const user = await getUsersById({ id: '123' });

// GET /api/posts (with typed query params)
const posts = await getPosts({ limit: 10, offset: 0 });

// POST /api/posts (with typed body)
const newPost = await postPosts({
  title: 'My Post',
  content: 'Post content',
  authorId: 1,
  tags: ['tech', 'vite'],
});
```

### Example with React Hooks

```tsx
import { useState, useEffect } from 'react';
import { getHealth, getUsersById } from './api.services';

function MyComponent() {
  const [health, setHealth] = useState<Awaited<ReturnType<typeof getHealth>> | null>(null);
  const [user, setUser] = useState<Awaited<ReturnType<typeof getUsersById>> | null>(null);

  useEffect(() => {
    async function loadData() {
      const healthData = await getHealth();
      setHealth(healthData);
      
      const userData = await getUsersById({ id: '123' });
      setUser(userData);
    }
    loadData();
  }, []);

  return (
    <div>
      <pre>{JSON.stringify(health, null, 2)}</pre>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}
```

### Using Fetch API directly

```typescript
// GET /api/health
const health = await fetch('/api/health').then(res => res.json());

// GET /api/users/:id
const user = await fetch('/api/users/123').then(res => res.json());

// POST /api/posts
const newPost = await fetch('/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Post',
    content: 'Post content',
    authorId: 1,
  }),
}).then(res => res.json());
```

## What This Example Demonstrates

This is the most complete example and demonstrates:

1. **Automatic type generation**: The `api.types.ts` and `api.services.ts` files are automatically generated by the plugin
2. **Complete type-safety**: All endpoints have generated TypeScript types
3. **Hierarchical middlewares**: Examples of middlewares applied globally and per folder
4. **Usage of generated services**: The React component uses the automatically generated typed functions
5. **All features**: Demonstrates all Vitek features in a complete example

## Comparison with Other Examples

- **basic-js**: Minimal example in pure JavaScript, without frameworks
- **js-react**: Example with React in JavaScript (without TypeScript)
- **typescript-react** (this): Complete example with TypeScript and React, showing all features
