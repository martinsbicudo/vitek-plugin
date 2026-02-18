# API Reference

Overview of the public API provided by `vitek-plugin`. Import from `vitek-plugin` in your project.

## Plugin

- **`vitek(options?)`** - Returns a Vite plugin. Call from `vite.config.ts` in the `plugins` array.
- **`VitekOptions`** - Type for plugin options: `apiDir`, `apiBasePath`, `enableValidation`, `logging`. See [Configuration](/guide/configuration).

## Types

- **`VitekContext`** - Context passed to route handlers (method, path, params, query, body, etc.).
- **`VitekRequest`** - Internal request representation.
- **`Route`** - Describes a registered route.
- **`RouteHandler`** - Type of the default export of a route file: `(context: VitekContext) => Promise<any> | any`.
- **`Middleware`** - Type of middleware functions: `(context, next) => Promise<void>`.
- **`RouteMatch`** - Result of matching a request to a route.

## Response Helpers

Use these to return custom status codes and headers from handlers:

- `json(body, options?)` - Custom JSON response with status and headers
- `ok(body, headers?)` - 200 OK
- `created(body, headers?)` - 201 Created
- `noContent(headers?)` - 204 No Content
- `badRequest(body?, headers?)` - 400
- `unauthorized(body?, headers?)` - 401
- `forbidden(body?, headers?)` - 403
- `notFound(body?, headers?)` - 404
- `conflict(body?, headers?)` - 409
- `unprocessableEntity(body?, headers?)` - 422
- `tooManyRequests(body?, headers?)` - 429
- `internalServerError(body?, headers?)` - 500
- `redirect(url, permanent?, preserveMethod?)` - 301/302/307/308

See [Response Handling](/guide/response-handling) for usage.

## Error Classes

Throw these in handlers for automatic status code and JSON error response:

- `VitekError` - Base error
- `HttpError` - Base for HTTP errors (has `statusCode`)
- `BadRequestError` - 400
- `UnauthorizedError` - 401
- `ForbiddenError` - 403
- `NotFoundError` - 404
- `ConflictError` - 409
- `ValidationError` - 422 (supports field errors object)
- `TooManyRequestsError` - 429
- `InternalServerError` - 500

See [Error Handling](/guide/error-handling) for usage.

## Validation

- **`validate(data, schema)`** - Returns validation result without throwing.
- **`validateOrThrow(data, schema)`** - Throws `ValidationError` if invalid.
- **`validateBody(body, schema)`** - Validates request body.
- **`validateQuery(query, schema)`** - Validates query parameters.
- **`ValidationSchema`** - Type: `Record<string, ValidationRule>`.
- **`ValidationRule`** - Type: `{ type, required?, min?, max?, pattern?, custom? }`.
- **`ValidationResult`** - Type returned by `validate`.

See [Request Validation](/guide/request-validation) for usage.
