export const CONFIGURATION_URI = 'vitek://docs/configuration';

export const CONFIGURATION_CONTENT = `# Vitek – Configuration

Pass options to \`vitek()\` in Vite config.

## Main options

- \`apiDir\` (default 'src/api') – directory for route files
- \`srcDir\` (default 'src') – for import rewriting
- \`apiBasePath\` (default '/api') – URL prefix
- \`buildApi\` (default true) – build API bundle for production; false = dev-only
- \`enableValidation\` (default false) – automatic validation
- \`openApi\` – true or object for OpenAPI/AsyncAPI docs
- \`sockets\` – true (default), false, or { path: '/ws' }
- \`logging\` – { level?, enableRequestLogging?, enableRouteLogging? }
- \`onGenerationError\` – callback when type/OpenAPI generation fails
- \`plugins\` – VitekPlugin[]
- \`alias\` – resolve aliases (e.g. { '@lib': 'src/lib' })
- \`cors\` – true or CorsOptions (origin, methods, allowedHeaders)
- \`trustProxy\` – trust X-Forwarded-* (sets context.clientIp)
- \`onError\` – (err, req, res) for non-HttpError
- \`maxBodySize\` – max body bytes (413 when exceeded)

Production: export \`onError\`, \`maxBodySize\`, etc. from \`dist/vitek.config.mjs\` when using vitek-serve.
`;
