# Bundle size

How the plugin and generated bundles are built, and how to keep output small.

## Plugin (your app’s dependency)

The plugin is consumed as TypeScript/JavaScript by Vite. There is no separate Rollup/terser step for the plugin; Vite uses the compiled output from `tsc` (`dist/`).

- **Tree-shaking:** The package uses **named exports**. Import only what you need so bundlers can drop unused code:

  ```ts
  import { vitek, json, HttpError } from 'vitek-plugin';
  ```

- **Dependencies:** Runtime and build dependencies (`connect`, `serve-static`, `ws`, `magic-string`, `esbuild`) are required for the features they support. Vite is a peer dependency so you control its version.

## Generated API bundles (vitek-api.mjs, vitek-sockets.mjs)

These files are produced by **esbuild** from your route and socket handlers. They are **minified** when you run `vite build`.

- **Size depends on your code:** Everything imported by your route/socket files is included. The main drivers of `vitek-api.mjs` size are: (1) number of routes and their imports, (2) heavy dependencies (e.g. Prisma client, SDKs) pulled into route files, and (3) shared code (e.g. middlewares, libs) imported by many routes. Heavy dependencies and large shared modules have the biggest impact.

- **Recommendations:**
  - Prefer importing only what each route needs (e.g. a single Prisma model or helper) instead of pulling the whole client at the top level.
  - Use dynamic `import()` inside a route if a dependency is only needed for a few paths (lazy load).
  - Keep route handlers focused so the bundler can exclude unused branches when possible.

## CLI (vitek, vitek-serve)

The CLI entrypoints (`vitek`, `vitek-serve`) are built into `dist/cli/`. They are kept minimal; init and serve do not load the full Vite plugin graph. If you need to reduce install size further, that would require separate package entrypoints (not currently provided).
