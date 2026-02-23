# API Docs Example (REST + WebSockets)

This example demonstrates Vitek's automatic API documentation: OpenAPI/Swagger for REST and AsyncAPI for WebSockets.

## Features

- Automatic `openapi.json` (REST) and `asyncapi.json` (WebSockets) generation
- Single docs page at `/api-docs.html` with **REST** and **WebSockets** tabs (Swagger UI + AsyncAPI)
- JSDoc-based documentation
- Type-safe API schemas

## Quick Start

```bash
pnpm install
pnpm dev
```

Then open:
- API docs (REST + WebSockets): http://localhost:5173/api-docs.html
- OpenAPI JSON: http://localhost:5173/openapi.json
- AsyncAPI JSON: http://localhost:5173/asyncapi.json

## API Endpoints

### HTTP (documented in OpenAPI/Swagger)

### GET /api/health
Health check endpoint.

### GET /api/users/:id
Get user by ID with full documentation.

### POST /api/users
Create a new user with typed request body.

### GET /api/posts
List posts with query parameters.

## WebSocket Endpoints

WebSocket endpoints are documented in the **WebSockets** tab of `/api-docs.html` (AsyncAPI). At runtime:

| Path         | Description           |
|--------------|-----------------------|
| `/api/ws`    | Root WebSocket (echo) |
| `/api/ws/chat` | Chat WebSocket (echo) |

Use the generated `socket.services.ts` for typed client connections:

```typescript
import { connect, connectChat } from './socket.services';

const ws = connect();
ws.onmessage = (e) => console.log(e.data);

const chat = connectChat();
chat.onmessage = (e) => console.log(e.data);
```

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
