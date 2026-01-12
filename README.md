<div align="center">
  <img src="./src/assets/logo.webp" alt="Vitek Plugin Logo" width="200" height="200" />
  
  # Vitek Plugin
  
  **File-based HTTP API generation for Vite**
  
  [![Version](https://img.shields.io/badge/version-0.1.0--beta-orange.svg)](https://github.com/yourusername/vitek-plugin)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Vite](https://img.shields.io/badge/vite-^5.0.0-646CFF.svg)](https://vitejs.dev/)
  
  > ⚠️ **Beta Version**: This project is currently in beta/testing phase. APIs may change in future releases.
</div>

---

## 🎯 About the Name "Vitek"

**Vitek** is a portmanteau combining **"Vite"** (the build tool) and **"tek"** (a suffix suggesting technology/toolkit). The name reflects the plugin's core purpose: bringing powerful API generation capabilities to the Vite ecosystem.

The "tek" suffix is commonly used in technology naming to denote tools and frameworks (similar to "kit" or "toolkit"), making "Vitek" a natural fit for a plugin that extends Vite's functionality with file-based API routing and type generation.

---

## 📖 Overview

**Vitek** is a powerful Vite plugin that enables automatic file-based HTTP API generation. Write your API endpoints as simple TypeScript/JavaScript files, and Vitek handles all the configuration, type generation, and integration with the Vite development server.

### Why Vitek?

- 🚀 **Zero Configuration**: Works out of the box with Vite - no separate server setup needed
- 📁 **File-Based Routing**: Organize your API like your file system - intuitive and scalable
- 🔥 **Hot Reload**: Automatic reloading of routes and middlewares on file changes
- 💪 **Type-Safe**: Full TypeScript support with auto-generated types and client helpers
- 🎯 **Developer Experience**: Generated client helpers for seamless frontend integration
- 🏗️ **Modular Architecture**: Core logic is runtime-agnostic, ready for other environments
- ⚡ **Lightweight**: Minimal overhead, runs directly in Vite's dev server
- 🔄 **Unified Development**: Same server for frontend and backend during development
- 📦 **No Dependencies**: Works with your existing Vite setup without additional runtime dependencies

---

## 🆚 Vitek vs. Other Solutions

### Comparison with Framework-Specific Solutions

#### **Next.js API Routes**

- **Next.js**: Requires Next.js framework, tightly coupled to React ecosystem
- **Vitek**: Framework-agnostic, works with any frontend (React, Vue, Svelte, vanilla JS)
- **Vitek Advantage**: More flexible, lighter weight, not tied to a specific framework

#### **SvelteKit API Routes**

- **SvelteKit**: Requires SvelteKit framework, Svelte-specific
- **Vitek**: Works with any frontend framework or no framework at all
- **Vitek Advantage**: Universal solution, not limited to Svelte projects

#### **Nuxt.js Server Routes**

- **Nuxt.js**: Vue.js-specific, requires Nuxt framework
- **Vitek**: Framework-independent, works with any stack
- **Vitek Advantage**: More versatile, can be used in any Vite project

### Comparison with Standalone Backend Solutions

#### **Express.js / Fastify**

- **Express/Fastify**: Separate Node.js server, requires server setup and configuration
- **Vitek**: Integrated with Vite dev server, no separate server needed
- **Vitek Advantage**: Simpler setup, unified development environment, automatic hot reload

#### **Hono**

- **Hono**: Fast web framework, but still requires separate server setup
- **Vitek**: File-based routing with automatic type generation, integrated with Vite
- **Vitek Advantage**: Better DX with file-based routing, automatic client generation

#### **tRPC**

- **tRPC**: Type-safe RPC framework, requires separate server setup
- **Vitek**: File-based REST API with automatic type generation, integrated with Vite
- **Vitek Advantage**: Simpler setup, standard REST API, works with any HTTP client

### Comparison with Full-Stack Frameworks

#### **Remix**

- **Remix**: Full-stack React framework with server-side rendering
- **Vitek**: Lightweight API layer, works with any frontend
- **Vitek Advantage**: More flexible, lighter, not tied to React or SSR

### Why Choose Vitek?

**Choose Vitek if you:**

- ✅ Want to add API routes to an existing Vite project
- ✅ Prefer file-based routing over manual route registration
- ✅ Want automatic type generation for your API
- ✅ Need a lightweight solution without framework lock-in
- ✅ Want unified development (frontend + backend in one server)
- ✅ Prefer REST APIs over RPC or GraphQL
- ✅ Want zero configuration and minimal setup

**Consider alternatives if you:**

- Need server-side rendering (use Next.js, Remix, or SvelteKit)
- Want GraphQL (use Apollo Server or similar)
- Need advanced features like WebSockets out of the box (use Express/Fastify with Socket.io)
- Are building a full-stack framework from scratch (use Hono, Express, or Fastify)
- Need production-ready server features (use Express, Fastify, or Hono with proper setup)

**Vitek's sweet spot**: Adding API routes to Vite projects with minimal configuration, automatic type safety, and excellent developer experience.

---

## ✨ Features

- ✅ **File-based routing**: Automatic routes based on file structure
- ✅ **Zero config**: Works automatically with the Vite server
- ✅ **Hot reload**: Automatically reloads routes and middlewares on save
- ✅ **Type-safe**: Automatically generates TypeScript types for all routes
- ✅ **Client helpers**: Generates typed functions to call the API from the frontend
- ✅ **Hierarchical middleware**: Middlewares per folder/subfolder
- ✅ **All HTTP methods**: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- ✅ **Dynamic parameters**: Support for `[id]` and `[...ids]` (catch-all)
- ✅ **Typed query params**: Define types for query parameters
- ✅ **Typed body**: Define types for request body
- ✅ **JavaScript support**: Works with both TypeScript and JavaScript projects
- ✅ **Isolated core**: Modular architecture, ready for other runtimes
- ✅ **Response control**: Custom status codes and headers via response helpers
- ✅ **HTTP error classes**: Built-in error classes with automatic status code mapping
- ✅ **Request validation**: Optional runtime validation for body and query parameters
- ✅ **Enhanced logging**: Configurable log levels and request/response logging

---

## 📦 Installation

```bash
npm install vitek-plugin
# or
pnpm add vitek-plugin
# or
yarn add vitek-plugin
```

**Requirements:**

- Vite ^5.0.0
- Node.js 18+ (for development)

---

## ⚡ Quick Start

### 1. Configure the Plugin

Add Vitek to your `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import { vitek } from "vitek-plugin";

export default defineConfig({
  plugins: [vitek()],
});
```

### 2. Create Your First Route

Create `src/api/health.get.ts`:

```typescript
import type { VitekContext } from "vitek-plugin";

export default function handler(context: VitekContext) {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
}
```

### 3. Start the Development Server

```bash
npm run dev
```

Visit: `http://localhost:5173/api/health` 🎉

---

## 📁 File Structure

### Naming Convention

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
  │       └── posts.get.ts       # GET /api/users/:id/posts
  └── posts/
      ├── index.get.ts           # GET /api/posts
      ├── index.post.ts          # POST /api/posts
      ├── [id].get.ts            # GET /api/posts/:id
      └── [...ids].get.ts        # GET /api/posts/*ids (catch-all)
```

### Dynamic Parameters

- **Single parameter**: `[id].get.ts` → `:id`
  - Example: `users/[id].get.ts` → `/api/users/:id`
- **Catch-all**: `[...ids].get.ts` → `*ids`
  - Example: `posts/[...ids].get.ts` → `/api/posts/*ids`
  - Captures: `/api/posts/1/2/3` → `params.ids = "1/2/3"`

### Supported HTTP Methods

All HTTP methods are supported through file extension:

- `.get.ts` → GET
- `.post.ts` → POST
- `.put.ts` → PUT
- `.patch.ts` → PATCH
- `.delete.ts` → DELETE
- `.head.ts` → HEAD
- `.options.ts` → OPTIONS

---

## 🎯 Usage Examples

### Example 1: Simple GET Route

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

### Example 2: Route with Dynamic Parameter

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

### Example 3: POST Route with Typed Body

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

### Example 4: Route with Query Parameters

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

### Example 5: Complete Route (Params + Body + Query)

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

### Example 6: Catch-All Route

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

---

## 🔌 Middlewares

### Global Middleware

Create `src/api/middleware.ts` to apply middlewares to all routes:

```typescript
// src/api/middleware.ts
import type { Middleware } from "vitek-plugin";

export default [
  async (context, next) => {
    // Executes before the route
    console.log(`[Global] ${context.method} ${context.path}`);

    await next(); // Continues to next middleware/handler

    // Executes after the route
    console.log(`[Global] Completed ${context.path}`);
  },
] satisfies Middleware[];
```

### Hierarchical Middleware by Folder

Middlewares are applied hierarchically based on folder structure:

```typescript
// src/api/posts/middleware.ts
// Applies to: /api/posts, /api/posts/:id, /api/posts/:id/comments, etc.

import type { Middleware } from "vitek-plugin";

export default [
  async (context, next) => {
    console.log(`[Posts Middleware] ${context.method} ${context.path}`);
    await next();
  },
] satisfies Middleware[];
```

```typescript
// src/api/posts/[id]/middleware.ts
// Applies to: /api/posts/:id/comments, but NOT /api/posts

import type { Middleware } from "vitek-plugin";

export default [
  async (context, next) => {
    // Validate post exists
    const postId = context.params.id;
    console.log(`[Post ID Middleware] Validating post ${postId}`);
    await next();
  },
] satisfies Middleware[];
```

**Middleware execution order:**

1. Global middleware (`src/api/middleware.ts`)
2. Folder-specific middleware (e.g., `src/api/posts/middleware.ts`)
3. Nested folder middleware (e.g., `src/api/posts/[id]/middleware.ts`)
4. Route handler

---

## 🎯 Response Handling

Vitek provides flexible response handling with support for custom status codes and headers.

### Basic Response (Backward Compatible)

Returning a plain object automatically creates a 200 OK JSON response:

```typescript
export default function handler(context: VitekContext) {
  return { message: "Success" }; // Status 200, JSON
}
```

### Custom Status Codes and Headers

Use response helpers for full control over HTTP responses:

```typescript
import { created, notFound, json } from "vitek-plugin";

export default function handler(context: VitekContext) {
  // 201 Created
  return created({ id: 123, message: "Resource created" });

  // 404 Not Found
  return notFound({ error: "Resource not found" });

  // Custom status and headers
  return json(
    { data: "custom" },
    {
      status: 201,
      headers: { "X-Custom-Header": "value" },
    }
  );
}
```

### Available Response Helpers

- `ok(body, headers?)` - 200 OK
- `created(body, headers?)` - 201 Created
- `noContent(headers?)` - 204 No Content
- `badRequest(body, headers?)` - 400 Bad Request
- `unauthorized(body, headers?)` - 401 Unauthorized
- `forbidden(body, headers?)` - 403 Forbidden
- `notFound(body, headers?)` - 404 Not Found
- `conflict(body, headers?)` - 409 Conflict
- `unprocessableEntity(body, headers?)` - 422 Validation Error
- `tooManyRequests(body, headers?)` - 429 Too Many Requests
- `internalServerError(body, headers?)` - 500 Internal Server Error
- `redirect(url, permanent?, preserveMethod?)` - 301/302/307/308 Redirect
- `json(body, options?)` - Custom JSON response with status and headers

---

## ⚠️ Error Handling

Vitek provides HTTP error classes for better error handling with automatic status code mapping.

### HTTP Error Classes

```typescript
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "vitek-plugin";

export default function handler(context: VitekContext) {
  const { params } = context;

  if (!params.id) {
    throw new BadRequestError("ID is required"); // Returns 400
  }

  const resource = findResource(params.id);
  if (!resource) {
    throw new NotFoundError("Resource not found"); // Returns 404
  }

  // Validation errors with field details
  throw new ValidationError("Validation failed", {
    email: ["Invalid email format"],
    age: ["Must be 18 or older"],
  }); // Returns 422
}
```

### Available Error Classes

- `BadRequestError` - 400 Bad Request
- `UnauthorizedError` - 401 Unauthorized
- `ForbiddenError` - 403 Forbidden
- `NotFoundError` - 404 Not Found
- `ConflictError` - 409 Conflict
- `ValidationError` - 422 Unprocessable Entity (with field errors)
- `TooManyRequestsError` - 429 Too Many Requests
- `InternalServerError` - 500 Internal Server Error

All errors automatically return the appropriate HTTP status code and JSON error response.

---

## ✅ Request Validation

Vitek provides optional runtime validation for request body and query parameters.

### Manual Validation

Use validation helpers in your handlers:

```typescript
import { validateBody, validateQuery, ValidationError } from "vitek-plugin";
import type { ValidationSchema } from "vitek-plugin";

export type Body = {
  title: string;
  content: string;
  authorId: number;
};

export default function handler(context: VitekContext) {
  // Validate body
  const body = validateBody(context.body, {
    title: { type: "string", required: true, min: 1, max: 200 },
    content: { type: "string", required: true, min: 10 },
    authorId: { type: "number", required: true, min: 1 },
  });

  // Validate query
  const query = validateQuery(context.query, {
    limit: { type: "number", min: 1, max: 100 },
    offset: { type: "number", min: 0 },
  });

  // If validation fails, ValidationError (422) is thrown automatically
  return { message: "Validated successfully", body, query };
}
```

### Validation Rules

```typescript
type ValidationRule = {
  type: "string" | "number" | "boolean" | "object" | "array";
  required?: boolean;
  min?: number; // For strings: min length, for numbers: min value, for arrays: min items
  max?: number; // For strings: max length, for numbers: max value, for arrays: max items
  pattern?: string | RegExp; // For strings: regex pattern
  custom?: (value: any) => boolean | string; // Custom validator
};
```

### Validation Functions

- `validate(data, schema)` - Returns validation result without throwing
- `validateOrThrow(data, schema)` - Throws `ValidationError` if invalid
- `validateBody(body, schema)` - Validates request body
- `validateQuery(query, schema)` - Validates query parameters

---

## 📝 Type Generation

Vitek automatically generates TypeScript types for all your routes.

### `src/api.types.ts`

Contains all route types and parameter definitions:

```typescript
// Auto-generated by Vitek - DO NOT EDIT

export type VitekParams = Record<string, string>;
export type VitekQuery = Record<string, string | string[]>;

export interface UsersIdGetParams extends VitekParams {
  id: string;
}

export type PostsPostBody = {
  title: string;
  content: string;
  authorId: number;
  tags?: string[];
};

export type PostsIndexGetQuery = {
  limit?: number;
  offset?: number;
};

// Union type with all routes
export type VitekRoute =
  | { pattern: "users/:id"; method: "get"; params: UsersIdGetParams }
  | { pattern: "posts"; method: "post"; params: PostsPostBody };
// ...
```

### `src/api.services.ts` (TypeScript) or `src/api.services.js` (JavaScript)

Contains typed helper functions to call the API from the frontend:

```typescript
import { getUsersById, postPosts, getPostsIdComments } from "./api.services";

// GET /api/users/:id
const user = await getUsersById({ id: "123" });

// POST /api/posts (with body)
const post = await postPosts({
  title: "Hello",
  content: "World",
});

// GET /api/posts/:id/comments (with params + query)
const comments = await getPostsIdComments(
  { id: "123" }, // params
  { limit: 10, offset: 0 } // query
);
```

**Generated services features:**

- ✅ Only necessary parameters are included (`params`, `body`, `query` only appear if defined)
- ✅ Unique function names automatically generated
- ✅ Complete types for autocomplete and type-checking (TypeScript projects)
- ✅ Last parameter is always `options?: RequestInit` for fetch customization

**Note:** For JavaScript projects, Vitek generates `api.services.js` without TypeScript types. For TypeScript projects, it generates both `api.types.ts` and `api.services.ts`.

---

## ⚙️ Configuration

### Plugin Options

```typescript
import { vitek } from "vitek-plugin";

export default defineConfig({
  plugins: [
    vitek({
      apiDir: "src/api", // API directory (default: 'src/api')
      apiBasePath: "/api", // API base path (default: '/api')
      enableValidation: false, // Enable automatic validation (default: false)
      logging: {
        level: "info", // Log level: 'debug' | 'info' | 'warn' | 'error'
        enableRequestLogging: false, // Log all requests/responses (default: false)
        enableRouteLogging: true, // Log route matches (default: true)
      },
    }),
  ],
});
```

### Options

| Option                         | Type                                     | Default     | Description                                                                                |
| ------------------------------ | ---------------------------------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `apiDir`                       | `string`                                 | `'src/api'` | Directory where API route files are located                                                |
| `apiBasePath`                  | `string`                                 | `'/api'`    | Base path for all API routes                                                               |
| `enableValidation`             | `boolean`                                | `false`     | Enable automatic request validation (currently manual validation is available via helpers) |
| `logging`                      | `object`                                 | `undefined` | Logging configuration                                                                      |
| `logging.level`                | `'debug' \| 'info' \| 'warn' \| 'error'` | `'info'`    | Minimum log level to display                                                               |
| `logging.enableRequestLogging` | `boolean`                                | `false`     | Log all HTTP requests with method, path, status code, and duration                         |
| `logging.enableRouteLogging`   | `boolean`                                | `true`      | Log route matches when requests are handled                                                |

---

## 📖 Examples

This repository includes three complete examples demonstrating different use cases:

### [basic-js](./examples/basic-js/)

**Pure JavaScript, no frameworks**

- Minimal example with pure JavaScript
- No TypeScript, no React
- Simple HTML page with fetch API
- Perfect for understanding the basics

**When to use**: Start here if you want to learn the fundamentals without any framework overhead.

### [js-react](./examples/js-react/)

**JavaScript with React (no TypeScript)**

- React application in JavaScript
- Uses generated services (without TypeScript types)
- Demonstrates Vitek integration with React
- Intermediate complexity

**When to use**: Perfect for React projects that prefer JavaScript over TypeScript.

### [typescript-react](./examples/typescript-react/)

**Complete TypeScript with React**

- Full-featured example with TypeScript and React
- Complete type-safety with generated types
- Hierarchical middlewares
- All HTTP methods and advanced features
- Most comprehensive example

**When to use**: Reference implementation showing all Vitek features with full type-safety.

---

## 🏗️ Architecture

Vitek follows a modular architecture:

- **Core**: Logic independent of Vite (reusable for other runtimes)
- **Adapters**: Integration with different runtimes (currently Vite)
- **Plugin**: Thin layer that registers the plugin in Vite

This allows the core to be used in other contexts (standalone Node.js, other bundlers, etc).

```
vitek-plugin/
├── src/
│   ├── core/              # Runtime-agnostic core logic
│   │   ├── context/       # Context creation
│   │   ├── file-system/  # File scanning and watching
│   │   ├── middleware/    # Middleware composition
│   │   ├── normalize/     # Path normalization
│   │   ├── routing/       # Route parsing and matching
│   │   ├── types/         # Type generation
│   │   └── validation/    # Request validation
│   ├── adapters/          # Runtime-specific adapters
│   │   └── vite/         # Vite integration
│   ├── shared/            # Shared utilities
│   │   ├── errors.ts     # Error classes
│   │   └── response-helpers.ts  # Response helper functions
│   └── plugin.ts         # Vite plugin entry point
```

---

## 🔍 How It Works

1. **Scan**: The plugin scans `src/api` looking for route files and middlewares
2. **Loading**: Loads handlers and middlewares using Vite's module system
3. **Type Generation**: Analyzes files and automatically generates TypeScript types (for TS projects)
4. **Service Generation**: Creates typed helper functions for the frontend
5. **Integration**: Registers middleware in the Vite server to intercept `/api/*` requests
6. **Hot Reload**: Watches for file changes and automatically reloads

---

## 🛠️ Development

### Building the Plugin

```bash
npm run build
# or
pnpm build
```

### Development Mode

```bash
npm run dev
# or
pnpm dev
```

This runs TypeScript compiler in watch mode.

---

## 🤝 Contributing

To contribute, make sure to follow the steps below:

1. Create a new branch:

   ```shell
   git checkout -b feat/your-new-feature
   ```

2. Make your changes, add unit tests (if applicable) and test with `npm link`

   On vitek-plugin project:

   ```shell
   npm link
   ```

   On your app/project:

   ```shell
   npm link vitek-plugin
   ```

   This will create a symlink into your `node_modules` app, and you can test iteratively. You can check more about npm-link [here](https://docs.npmjs.com/cli/v9/commands/npm-link)

3. Before to push your changes to origin, open your pull request and fill all required fields.
   1. Make sure to fill the **Release** section with what your pull request changes. **This section is required to merge pull request.**
4. Set a _required_ `semver` label according to your change:
   1. `semver:patch`: used when you submit a fix to a bug, enhance performance, etc;
   2. `semver:minor`: used when you submit a new component, new feature, etc;
   3. `semver:major`: used when you submit some breaking change, etc;
   4. `semver:prerelease`: used when you submit a prerelease (ex: `0.1.0-beta.1`);
   5. `semver:bypass`: used to update docs, or something that doesn't affect the build.

> Info: Once you have merged your pull request, with all required fields, GitHub Actions will be responsible to create a new build and publish.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**MIT License** means:

- ✅ Free to use for personal and commercial projects
- ✅ Free to modify
- ✅ Free to distribute
- ✅ Free to use privately
- ✅ No warranty or liability

---

## ⚠️ Beta Status

**This project is currently in beta/testing phase.**

- Version: `0.1.0-beta`
- APIs may change in future releases
- Some features may be experimental
- Feedback and bug reports are welcome!

---

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- Inspired by file-based routing patterns from Next.js and SvelteKit
- Type generation powered by TypeScript

---

## 📞 Support

- 🐛 **Found a bug?** [Open an issue](https://github.com/yourusername/vitek-plugin/issues)
- 💡 **Have a suggestion?** [Open a discussion](https://github.com/yourusername/vitek-plugin/discussions)
- 📖 **Need help?** Check the [examples](./examples/) directory

---

<div align="center">
  <p>Made with ❤️ for the Vite community</p>
  <p>
    <a href="https://github.com/yourusername/vitek-plugin">GitHub</a> •
    <a href="https://npmjs.com/package/vitek-plugin">NPM</a> •
    <a href="LICENSE">License</a>
  </p>
</div>
