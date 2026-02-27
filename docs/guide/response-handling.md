# Response Handling

Vitek supports plain object responses (default 200 JSON) and full control via response helpers.

## Basic Response (Backward Compatible)

Returning a plain object automatically creates a 200 OK JSON response:

```typescript
export default function handler(context: VitekContext) {
  return { message: "Success" }; // Status 200, JSON
}
```

## Custom Status Codes and Headers

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

## Available Response Helpers

| Helper | Status | Signature |
|--------|--------|-----------|
| `ok` | 200 OK | `ok(body, headers?)` |
| `created` | 201 Created | `created(body, headers?)` |
| `noContent` | 204 No Content | `noContent(headers?)` |
| `badRequest` | 400 Bad Request | `badRequest(body?, headers?)` |
| `unauthorized` | 401 Unauthorized | `unauthorized(body?, headers?)` |
| `forbidden` | 403 Forbidden | `forbidden(body?, headers?)` |
| `notFound` | 404 Not Found | `notFound(body?, headers?)` |
| `conflict` | 409 Conflict | `conflict(body?, headers?)` |
| `unprocessableEntity` | 422 Validation Error | `unprocessableEntity(body?, headers?)` |
| `tooManyRequests` | 429 Too Many Requests | `tooManyRequests(body?, headers?)` |
| `internalServerError` | 500 Internal Server Error | `internalServerError(body?, headers?)` |
| `redirect` | 301/302/307/308 | `redirect(url, permanent?, preserveMethod?)` |
| `json` | Custom | `json(body, options?)` with `status` and `headers` |

## Cache headers

Use `cacheControl` and `noStore` to add `Cache-Control` headers. Merge the returned object into your response headers:

```typescript
import { ok, cacheControl, noStore } from "vitek-plugin";

// Cache for 60 seconds (public)
return { ...ok(data), headers: { ...ok(data).headers, ...cacheControl(60) } };

// With stale-while-revalidate and private
return {
  ...ok(data),
  headers: { ...ok(data).headers, ...cacheControl(60, { staleWhileRevalidate: 120, private: true }) },
};

// Disable caching
return { ...ok(data), headers: { ...ok(data).headers, ...noStore() } };
```

| Helper | Returns | Description |
|--------|--------|--------------|
| `cacheControl(maxAgeSeconds, options?)` | `Record<string, string>` | `Cache-Control: max-age=N`. Options: `staleWhileRevalidate?: number`, `private?: boolean`. |
| `noStore()` | `Record<string, string>` | `Cache-Control: no-store`. |

For **ETag**, set the header manually in your response (e.g. `headers: { ...ok(body).headers, 'ETag': '"' + etagValue + '"' }`). The framework does not compute ETags automatically.
