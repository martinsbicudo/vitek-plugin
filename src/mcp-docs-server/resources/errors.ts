export const ERRORS_URI = 'vitek://docs/errors';

export const ERRORS_CONTENT = `# Vitek – Error handling

HTTP error classes map to status codes and JSON error response.

## Error classes (from vitek-plugin)

- BadRequestError → 400
- UnauthorizedError → 401
- ForbiddenError → 403
- NotFoundError → 404
- ConflictError → 409
- ValidationError → 422 (supports field errors object: { email: ["Invalid"], age: ["Must be 18+"] })
- TooManyRequestsError → 429
- InternalServerError → 500

\`\`\`typescript
import { NotFoundError, ValidationError } from "vitek-plugin";

if (!resource) throw new NotFoundError("Resource not found");
throw new ValidationError("Invalid", { email: ["Invalid format"] });
\`\`\`

## onError (non-HttpError)

For uncaught exceptions or non-HttpError, set \`onError(err, req, res)\` in plugin options. Send response and call \`res.end()\`; otherwise default 500 JSON is sent. In production with vitek-serve, export \`onError\` from \`dist/vitek.config.mjs\`.
`;
