# Error Handling

Vitek provides HTTP error classes that map to the correct status codes and return a JSON error response.

## HTTP Error Classes

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

## Available Error Classes

| Class | Status |
|-------|--------|
| `BadRequestError` | 400 Bad Request |
| `UnauthorizedError` | 401 Unauthorized |
| `ForbiddenError` | 403 Forbidden |
| `NotFoundError` | 404 Not Found |
| `ConflictError` | 409 Conflict |
| `ValidationError` | 422 Unprocessable Entity (supports field errors object) |
| `TooManyRequestsError` | 429 Too Many Requests |
| `InternalServerError` | 500 Internal Server Error |

All errors automatically return the appropriate HTTP status code and a JSON error response (e.g. `name`, `message`, `code`).

## Custom error handler (onError)

For errors that are **not** `HttpError` (e.g. uncaught exceptions, database errors), you can provide an `onError` callback in the plugin options. It receives `(err, req, res)`. If you send a response and call `res.end()`, that response is used; otherwise the default 500 JSON response is sent.

```typescript
vitek({
  onError(err, req, res) {
    // Log to your error service
    console.error(err);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Service Unavailable' }));
  },
});
```

In production with **vitek-serve**, export `onError` from `dist/vitek.config.mjs` so the same handler runs. See [Production server](/guide/production-server#production-config-vitekconfigmjs).

## Error handling in production

With vitek-serve, uncaught errors in route handlers are passed to your `onError` export from `vitek.config.mjs` if defined; otherwise the server sends a default 500 JSON response. Use `onError` to log to your monitoring (e.g. Sentry), return a custom status or body, or avoid leaking stack traces. The same request/response semantics apply as in dev; ensure you call `res.end()` when sending a custom response.
