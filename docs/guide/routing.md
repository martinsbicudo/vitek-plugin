# Routing

Route handlers receive a `VitekContext` and return a plain object (or a response from [response helpers](/guide/response-handling)). Below are common patterns.

## Example 1: Simple GET Route

```typescript
// src/api/health.get.ts
import type { VitekContext } from "vitek-plugin";

export default function handler(context: VitekContext) {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
}
```

## Example 2: Route with Dynamic Parameter

```typescript
// src/api/users/[id].get.ts
import type { VitekContext } from "vitek-plugin";

export default async function handler(context: VitekContext) {
  const { params } = context;

  return {
    id: params.id,
    name: `User ${params.id}`,
    email: `user${params.id}@example.com`,
  };
}
```

## Example 3: POST Route with Typed Body

```typescript
// src/api/posts/index.post.ts
import type { VitekContext } from "vitek-plugin";

export type Body = {
  title: string;
  content: string;
  authorId: number;
  tags?: string[];
};

export default async function handler(context: VitekContext) {
  const { body } = context;

  return {
    message: "Post created",
    post: {
      id: Math.random(),
      ...body,
      createdAt: new Date().toISOString(),
    },
  };
}
```

## Example 4: Route with Query Parameters

```typescript
// src/api/posts/index.get.ts
import type { VitekContext } from "vitek-plugin";

export type Query = {
  limit?: number;
  offset?: number;
};

export default async function handler(context: VitekContext) {
  const { query } = context;

  const limit = query.limit ? Number(query.limit) : 10;
  const offset = query.offset ? Number(query.offset) : 0;

  return {
    posts: [],
    pagination: { limit, offset },
  };
}
```

## Example 5: Complete Route (Params + Body + Query)

```typescript
// src/api/posts/[id]/comments.post.ts
import type { VitekContext } from "vitek-plugin";

export type Body = {
  text: string;
  authorId: number;
};

export type Query = {
  notify?: boolean;
  sendEmail?: boolean;
};

export default async function handler(context: VitekContext) {
  const { params, body, query } = context;

  return {
    message: "Comment created",
    postId: params.id,
    comment: {
      id: Math.random(),
      ...body,
      postId: params.id,
      notify: query.notify || false,
    },
  };
}
```

## Example 6: Catch-All Route

```typescript
// src/api/posts/[...ids].get.ts
import type { VitekContext } from "vitek-plugin";

export default async function handler(context: VitekContext) {
  const { params } = context;

  // params.ids contains all segments: "1/2/3" for /api/posts/1/2/3
  const ids = params.ids.split("/");

  return {
    ids,
    message: "Multiple posts requested",
  };
}
```
