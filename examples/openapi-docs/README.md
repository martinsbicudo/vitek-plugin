# OpenAPI Documentation Example

This example demonstrates Vitek's automatic OpenAPI/Swagger documentation generation.

## Features

- Automatic `openapi.json` generation
- Interactive Swagger UI at `/api-docs.html`
- JSDoc-based documentation
- Type-safe API schemas

## Quick Start

```bash
pnpm install
pnpm dev
```

Then open:
- Swagger UI: http://localhost:5173/api-docs.html
- OpenAPI JSON: http://localhost:5173/openapi.json

## API Endpoints

### GET /api/health
Health check endpoint.

### GET /api/users/:id
Get user by ID with full documentation.

### POST /api/users
Create a new user with typed request body.

### GET /api/posts
List posts with query parameters.

## Documentation Structure

Each route file includes JSDoc comments:

```typescript
/**
 * Get user by ID
 * 
 * @summary Get user details
 * @description Retrieves a user by their unique identifier
 * @tag Users
 * @param id - The user's unique ID
 * @response 200 {object} - User found
 * @response 404 - User not found
 */
```

The OpenAPI spec is automatically generated from:
- File-based routing
- JSDoc annotations
- TypeScript types (Body, Query, Params)
