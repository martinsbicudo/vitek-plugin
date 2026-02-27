# Security

This page summarizes security-related options and practices when using Vitek.

## Body size limit

Request bodies are read into memory. To avoid unbounded memory use or DoS from large payloads, set a limit:

- **Plugin (dev/preview):** `maxBodySize` in bytes in your Vitek options.
- **Production (vitek-serve):** Export `maxBodySize` from `dist/vitek.config.mjs` or pass it via your config.

When the limit is exceeded, the server responds with **413 Payload Too Large** and does not accumulate more body data.

```ts
vitek({ maxBodySize: 1024 * 1024 }) // 1MB
```

## CORS

Configure CORS for production. Avoid `origin: '*'` when using credentials. Restrict to your front-end origin(s):

```ts
vitek({
  cors: {
    origin: ['https://myapp.com'],
    credentials: true,
  },
})
```

## Trust proxy

Set `trustProxy: true` only when the app is behind a reverse proxy (e.g. nginx, Cloudflare). This allows correct `clientIp` and effective URL from `X-Forwarded-*` headers. Do not enable it if the client can send those headers directly, or they will be trusted and can be spoofed.

## Response headers

Header values set from route handler responses (e.g. `headers` in a `VitekResponse`) are sanitized: CR and LF are removed before calling `setHeader`. This reduces the risk of HTTP response splitting when values are user-influenced.

## Validation and ReDoS

`ValidationRule.pattern` (string) is compiled with `new RegExp(pattern)`. Complex or user-supplied patterns can cause ReDoS (regular expression denial of service). Prefer:

- Allowlists or simple character classes.
- Avoiding patterns from untrusted input.

Validation runs in the request path; keep rules simple and fast.

## Dependencies

Keep dependencies up to date and run audits:

```bash
pnpm audit
npm audit
```

Relevant runtime dependencies include `connect`, `serve-static`, `ws`, and (for build) `magic-string`, `esbuild`. Upgrade and address reported vulnerabilities.

## Logging

Avoid logging full request bodies or headers in production. If you enable request logging or custom hooks, ensure sensitive data is not written to logs or external systems.

## Path and routing

Routes are matched against a known list derived from the file system; the request path is not used to read files from disk. Path traversal via URL is not applicable to route handling.
