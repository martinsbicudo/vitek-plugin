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
