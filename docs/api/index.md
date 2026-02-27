# API Reference

Overview of the public API provided by `vitek-plugin`. Import from `vitek-plugin` in your project.

## Plugin

- **`vitek(options?)`** - Returns a Vite plugin. Call from `vite.config.ts` in the `plugins` array.
- **`VitekOptions`** - Type for plugin options: `apiDir`, `apiBasePath`, `openApi`, `enableValidation`, `logging`, `sockets`, `plugins`, `alias`, `onGenerationError`, etc. See [Configuration](/guide/configuration).

## Plugin API (Extensibility)

- **`VitekPlugin`** - Type for external plugins with hooks.
- **`afterTypesGenerated(ctx)`** - Hook called after types/services/OpenAPI are generated.
- **`beforeApiRequest(ctx)`** - Hook called before each API request; call `next()` to continue or send a response to short-circuit.
- **`AfterTypesGeneratedContext`** - Context: `root`, `schema`, `sockets`, `apiBasePath`, `socketBasePath`.
- **`BeforeApiRequestContext`** - Context: `req`, `res`, `path`, `method`, `next`.

Pass plugins via `vitek({ plugins: [myPlugin] })`. See [Plugin API](/guide/plugin-api) for usage.

## Introspection

- **`getManifest(root, apiDir)`** - Returns `{ routes, middlewares, sockets }` with metadata. Paths are relative to root.
- **`getRoutes(root, apiDir)`** - Returns `ParsedRoute[]`: `{ method, pattern, params, file }`.
- **`getSockets(root, apiDir)`** - Returns `ParsedSocket[]`: `{ pattern, params, file }`.
- **`writeManifest(root, apiDir, outDir)`** - Writes `vitek-manifest.json` to outDir.
- **`VitekManifest`** - Type for the manifest object.
- **`ParsedRoute`** - Type for parsed route metadata.
- **`ParsedSocket`** - Type for parsed socket metadata.

See [Introspection API](/guide/introspection) for the manifest format and use cases.

## Documentation (OpenAPI / AsyncAPI)

When using `openApi: true` (or an options object) in plugin options:

- **`OpenApiOptions`** - Options for OpenAPI generation: `info`, `servers`, `apiBasePath`.
- **`OpenApiInfo`** - API info: `title`, `version`, `description`.
- **`OpenApiServer`** - Server entry: `url`, `description`.
- **`AsyncApiOptions`** - Options for AsyncAPI generation (used internally when sockets exist): `info`, `serverUrl`.
- **`AsyncApiInfo`** - AsyncAPI info: `title`, `version`, `description`.

See [OpenAPI / Swagger + AsyncAPI](/guide/openapi) for the full guide.

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

## WebSockets

- **Socket handler context** – The argument to `*.socket.ts`/`*.socket.js` handlers: `socket`, `req`, `params`, `path`, and optionally **`api`** (internal API client). See [WebSockets](/guide/websockets).
- **`ctx.api`** – When present, provides **`fetch(path, options?)`** to call REST endpoints internally from a socket handler. Path is relative to the API base path.
- **`context.sockets`** – In HTTP route handlers, when provided: **`emit(pattern, data)`** to push data to WebSocket clients connected to that socket path (`pattern` = `''` for root, `'chat'` for `/api/ws/chat`, etc.).
