# OpenAPI / Swagger Documentation

Vitek can automatically generate OpenAPI 3.0 specifications and serve interactive Swagger UI documentation for your API.

## Quick Start

Enable OpenAPI generation in your Vite config:

```typescript
import { defineConfig } from 'vite';
import { vitek } from 'vitek-plugin';

export default defineConfig({
  plugins: [
    vitek({
      openApi: true, // Enable with default settings
    }),
  ],
});
```

This generates:
- `public/openapi.json` - The OpenAPI specification
- `public/api-docs.html` - Interactive Swagger UI

Access your docs at: `http://localhost:5173/api-docs.html`

When you have [WebSocket routes](./websockets.md), the plugin also generates:
- `public/asyncapi.json` - AsyncAPI 2.x specification for WebSocket endpoints
- The same `api-docs.html` page gains **REST** and **WebSockets** tabs: Swagger UI for HTTP and AsyncAPI documentation for WebSockets.

### AsyncAPI (WebSockets)

If your project has socket routes (`.socket.ts` / `.socket.js`), the plugin generates an AsyncAPI 2.4.0 spec from them. Each socket path becomes a channel (subscribe/publish). The **WebSockets** tab in `api-docs.html` loads this spec and renders it with the AsyncAPI React component. The server URL in the spec uses your socket base path (e.g. `ws://localhost:5173/api/ws`). There is no separate configuration for AsyncAPI; it is generated whenever `openApi` is enabled and at least one socket route exists.

### All-Defaults Configuration

Even simpler - just enable with an empty object:

```typescript
vitek({
  openApi: {} // Uses all defaults
})
```

Defaults used:
- **Title:** "Vitek API"
- **Version:** "1.0.0"
- **Description:** "Auto-generated API documentation"
- **Servers:** Current URL (where Swagger UI is accessed)

## Configuration Options

### Basic Configuration

```typescript
vitek({
  openApi: {
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'A description of my API',
    },
    servers: [
      { url: 'http://localhost:5173', description: 'Development' },
      { url: 'https://api.example.com', description: 'Production' },
    ],
  },
});
```

### Options Reference

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `info` | `object` | No | See below | API information |
| `info.title` | `string` | No | `"Vitek API"` | API title |
| `info.version` | `string` | No | `"1.0.0"` | API version |
| `info.description` | `string` | No | `"Auto-generated API documentation"` | API description |
| `servers` | `array` | No | Current URL | List of server URLs |
| `apiBasePath` | `string` | No | `"/api"` | Base path for API |

## Documenting Your Routes

### JSDoc Annotations

Vitek extracts documentation from JSDoc comments in your route files:

```typescript
/**
 * Get user by ID
 * 
 * Retrieves detailed information about a specific user.
 * 
 * @summary Get user details
 * @description Fetches a user by their unique identifier.
 *              Returns 404 if user not found.
 * @tag Users
 * @param id - The unique identifier of the user
 * @response 200 {object} - User found successfully
 * @response 404 - User not found
 * @response 500 - Internal server error
 */
export default async function handler(context: VitekContext) {
  // Handler implementation
}
```

### Available Annotations

| Annotation | Description | Example |
|------------|-------------|---------|
| `@summary` | Short summary of the operation | `@summary Get user details` |
| `@description` | Detailed description | `@description Fetches a user...` |
| `@tag` | Group routes by tag | `@tag Users` |
| `@param` | Document path parameters | `@param id - User ID` |
| `@bodyDescription` | Describe request body | `@bodyDescription User data` |
| `@response` | Document response codes | `@response 200 {User} - Success` |
| `@deprecated` | Mark as deprecated | `@deprecated` |

### Response Documentation

Document responses with the `@response` tag:

```typescript
/**
 * @response 200 {User} - User found successfully
 * @response 400 - Invalid request
 * @response 401 - Unauthorized
 * @response 404 - User not found
 * @response 500 - Internal server error
 */
```

Response format: `@response CODE {TYPE} - DESCRIPTION`

## Type Schemas

### Body Types

Define request body types for automatic schema generation:

```typescript
export type Body = {
  title: string;
  content: string;
  published?: boolean;
};

export default async function handler(context: VitekContext) {
  const { body } = context; // Typed as Body
  // ...
}
```

### Query Types

Define query parameter types:

```typescript
export type Query = {
  page?: number;
  limit?: number;
  search?: string;
};

export default async function handler(context: VitekContext) {
  const { query } = context; // Typed as Query
  // ...
}
```

## Complete Example

```typescript
// src/api/posts/[id].put.ts

/**
 * Update a post
 * 
 * Updates an existing blog post. All fields are optional - 
 * only provided fields will be updated.
 * 
 * @summary Update post
 * @description Partially updates a blog post by ID.
 * @tag Posts
 * @param id - The post ID to update
 * @bodyDescription Fields to update
 * @response 200 {object} - Post updated successfully
 * @response 400 - Invalid input
 * @response 404 - Post not found
 * @deprecated Use PATCH instead
 */

import type { VitekContext } from 'vitek-plugin';

export interface Params {
  id: string;
}

export type Body = {
  title?: string;
  content?: string;
  tags?: string[];
};

export default async function handler(context: VitekContext) {
  const { params, body } = context;
  
  return {
    id: params.id,
    updated: true,
    changes: body,
  };
}
```

## Generated Specification

The generated `openapi.json` follows the OpenAPI 3.0.3 specification and includes:

- All registered routes with methods and paths
- Path parameters extracted from route patterns
- Query parameters from Query types
- Request bodies from Body types
- Response codes and descriptions from JSDoc
- Tags for grouping operations

## REST tab (Swagger UI)

The generated Swagger UI provides:

- Interactive API documentation
- "Try it out" functionality for testing endpoints
- Request/response schemas
- Code samples in multiple languages
- Search and filter capabilities

Access it at `http://localhost:5173/api-docs.html` (or your dev server URL). When you have WebSocket routes, the same page includes a **WebSockets** tab with AsyncAPI documentation.

## Production Considerations

The API documentation files (`openapi.json`, `asyncapi.json`, and `api-docs.html`) are generated in the `public/` directory, so they are:
- Available during development
- Copied to the build output
- Served as static files in production

To exclude from production builds:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['**/openapi.json', '**/asyncapi.json', '**/api-docs.html'],
    },
  },
});
```

## TypeScript Support

Import OpenAPI and AsyncAPI types if needed:

```typescript
import type { OpenApiOptions, OpenApiInfo, AsyncApiOptions, AsyncApiInfo } from 'vitek-plugin';

const openApiConfig: OpenApiOptions = {
  info: {
    title: 'My API',
    version: '1.0.0',
  },
};
```
