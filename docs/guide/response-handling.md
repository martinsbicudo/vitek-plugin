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
| `text` | 200 (or custom) | `text(body: string, status?)` — plain text |
| `html` | 200 (or custom) | `html(body: string, status?)` — HTML |

## Plain text and HTML

Use `text()` and `html()` for non-JSON responses:

```typescript
import { text, html } from "vitek-plugin";

// Plain text (Content-Type: text/plain; charset=utf-8)
return text("Hello, world!");
return text("Error", 503);

// HTML (Content-Type: text/html; charset=utf-8)
return html("<h1>Welcome</h1><p>Page content.</p>");
return html("<h1>Not Found</h1>", 404);
```

## Streaming and SSE

You can return a **stream** as the response body. The handler must return a `VitekResponse` with `body` set to a Node.js `ReadableStream` (e.g. `stream.Readable`, or the result of `Readable.from()`). The server will pipe it to the client.

Example: **Server-Sent Events (SSE)** — set `Content-Type: text/event-stream` and use a readable stream:

```typescript
import { Readable } from "stream";

export default function handler() {
  const stream = new Readable({
    read() {
      this.push("data: " + JSON.stringify({ t: Date.now() }) + "\n\n");
      const t = setTimeout(() => {
        this.push("data: " + JSON.stringify({ t: Date.now() }) + "\n\n");
        this.push(null); // end stream
      }, 1000);
      this.on("close", () => clearTimeout(t));
    },
  });
  return {
    status: 200,
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store" },
    body: stream,
  };
}
```

For one-off streaming (e.g. a file), you can use `Readable.from()` or `fs.createReadStream()` and pass the stream as `body`.

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
