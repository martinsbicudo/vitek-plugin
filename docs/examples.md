# Examples

This repository includes four complete examples demonstrating different use cases of the Vitek plugin. Each example is self-contained and can be run independently.

## basic-js

**Pure JavaScript, no frameworks**

Minimal example with pure JavaScript. No TypeScript, no React. Simple HTML page with fetch API. Perfect for understanding the basics.

**Key features:** Pure JavaScript, no frameworks, simple HTML + fetch, basic routes, generated `api.services.js`.

**When to use:** Start here to learn the fundamentals without any framework overhead.

**Tech stack:** JavaScript, Vite, HTML.

---

## js-react

**JavaScript with React (no TypeScript)**

React application in JavaScript. Uses generated services without TypeScript types. Demonstrates Vitek integration with React. Intermediate complexity.

**Key features:** React with JSX, no TypeScript, generated JS services, React Hooks examples.

**When to use:** React projects that prefer JavaScript; teams not ready for TypeScript.

**Tech stack:** JavaScript, React, Vite, JSX.

---

## typescript-react

**Complete TypeScript with React**

Full-featured example with TypeScript and React. Complete type-safety with generated types. Hierarchical middlewares. All HTTP methods and advanced features. Most comprehensive example.

**Key features:** TypeScript, full type-safety, React, hierarchical middlewares, all HTTP methods, dynamic params, typed body/query, response helpers, HTTP error classes, request validation.

**When to use:** Production-ready apps; teams using TypeScript; reference implementation.

**Tech stack:** TypeScript, React, Vite, TSX.

---

## docker

**TypeScript + React with Docker and docker-compose**

Same app as typescript-react, runnable in a container. Uses pnpm for install and scripts. No database or extra services.

**Key features:** TypeScript, React, full type-safety (same as typescript-react), Dockerfile and docker-compose for containerized dev. Install and build inside the container use pnpm.

**When to use:** Containerized development or deployment; teams standardizing on Docker; CI environments.

**Tech stack:** TypeScript, React, Vite, TSX, Docker, docker-compose, pnpm.

**Run with Docker:** From `examples/docker`, run `docker compose up --build`, then open `http://localhost:5173`. No need to build the plugin from the repo root—the example uses the published vitek-plugin from npm. All examples include a **start** script (vitek-serve) for production: after `vite build`, run `pnpm start` to serve static + API. The [docker example](https://github.com/martinsbicudo/vitek-plugin/blob/main/examples/docker/README.md) documents production with Docker (vitek-serve).

---

## Comparison Table

| Feature | basic-js | js-react | typescript-react | docker |
|---------|----------|----------|------------------|--------|
| Language | JavaScript | JavaScript | TypeScript | TypeScript |
| Framework | None | React | React | React |
| Type Safety | No | No | Yes | Yes |
| Response Helpers | No | No | Yes | Yes |
| Error Classes | No | No | Yes | Yes |
| Validation | No | No | Yes | Yes |
| Generated Types | No | No | Yes | Yes |
| Generated Services | Yes (JS) | Yes (JS) | Yes (TS) | Yes (TS) |
| Middlewares | No | No | Yes | Yes |
| HTTP Methods | GET, POST | GET, POST | All methods | All methods |
| Docker | No | No | No | Yes |
| Complexity | Low | Medium | High | High |
| Best For | Learning | React (JS) | Production | Docker / containerized dev |

---

## Quick Start

1. **Build the plugin** from the project root:
   ```bash
   npm run build
   # or
   pnpm build
   ```

2. **Go to an example** and install (for **docker**, skip to step 2b if using Docker):
   ```bash
   cd examples/basic-js   # or js-react, or typescript-react
   npm install
   # or
   pnpm install
   ```
   **docker only:** From `examples/docker`, run `docker compose up --build` (uses pnpm inside the container). No need to build the plugin from the repo root.

3. **Start the dev server:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Open your browser at `http://localhost:5173`.

5. **Production (optional):** Run `pnpm run build` then `pnpm run start` (vitek-serve) to serve the built app with the API. See [Production server](/guide/production-server).

---

## Links to Example READMEs

- [basic-js](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/basic-js) - Detailed basic-js documentation
- [js-react](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/js-react) - Detailed js-react documentation
- [typescript-react](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/typescript-react) - Detailed typescript-react documentation
- [docker](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/docker) - TypeScript + React with Docker and docker-compose (pnpm)

---

## Troubleshooting

- **Plugin not found:** Run `npm run build` or `pnpm build` from the repository root, then try the example again.
- **Routes not working:** Ensure route files follow the `[name].[method].ts` or `.js` convention and export a default handler.

For more, see the [examples README](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples) troubleshooting section.
