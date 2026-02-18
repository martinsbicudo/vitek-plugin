# How It Works

## 1. Scan

The plugin scans the API directory (default `src/api`) for route files (`[name].[method].ts` or `.js`) and middleware files (`middleware.ts` or `middleware.js`).

## 2. Loading

Handlers and middlewares are loaded using Vite's module system so that they benefit from Vite's resolution, transforms, and caching.

## 3. Type Generation

For TypeScript projects, the plugin analyzes route files and generates `api.types.ts` with params, body, query types and a `VitekRoute` union. Types are updated when files change.

## 4. Service Generation

The plugin generates `api.services.ts` (TypeScript) or `api.services.js` (JavaScript) with typed helper functions that call your API. These are updated when routes change.

## 5. Integration

A middleware is registered on the Vite dev server that intercepts requests under the API base path (default `/api`). Incoming requests are matched against the parsed routes; the matched handler runs after applicable middlewares.

## 6. Hot Reload

The plugin watches the API directory. When you add, change, or remove route or middleware files, routes and generated types/services are updated and the dev server reflects the changes without a full restart.

## 7. Build and preview

When you run `vite build` (and `buildApi` is not disabled), the plugin also bundles your API into `dist/vitek-api.mjs`. When you run `vite preview`, that bundle is loaded and the same middleware serves `/api/*` alongside the static assets. The same bundle can be used in production by serving `dist` with a server that loads it.
