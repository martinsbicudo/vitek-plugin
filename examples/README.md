# Vitek Plugin Examples

This directory contains complete, working examples demonstrating different use cases of the Vitek plugin. Each example is self-contained and can be run independently.

## 📚 Available Examples

### [socket-only](./socket-only/)

**WebSocket-only example**

Minimal example focused on WebSocket endpoints. No HTTP API routes—only socket files under `/ws/*`.

**Key Features:**

- ✅ Pure JavaScript
- ✅ WebSocket-only (`*.socket.js`)
- ✅ Generated socket services (`socket.services.js`)
- ✅ Simple HTML demo with live connection

**Best for:**

- Learning WebSocket routing with Vitek
- Real-time apps (chat, notifications, etc.)
- Understanding socket file conventions

**Tech Stack:**

- JavaScript
- Vite
- HTML

---

### [basic-js](./basic-js/)

**Pure JavaScript, no frameworks**

The simplest example to get started with Vitek. Perfect for understanding the fundamentals without any framework overhead.

**Key Features:**

- ✅ Pure JavaScript (no TypeScript)
- ✅ No frameworks (no React, Vue, etc.)
- ✅ Simple HTML page with fetch API
- ✅ Basic routes demonstration
- ✅ WebSocket socket (chat.socket.js)
- ✅ Generated JavaScript services (`api.services.js`)

**Best for:**

- Learning the basics of Vitek
- Understanding file-based routing
- Projects that want to keep it simple
- Quick prototypes

**Tech Stack:**

- JavaScript
- Vite
- HTML

---

### [js-react](./js-react/)

**JavaScript with React (no TypeScript)**

A practical example showing how to integrate Vitek with React while keeping JavaScript simplicity.

**Key Features:**

- ✅ React with JavaScript (JSX)
- ✅ No TypeScript
- ✅ Generated JavaScript services
- ✅ WebSocket socket (chat.socket.js)
- ✅ React Hooks integration examples
- ✅ Intermediate complexity

**Best for:**

- React projects that prefer JavaScript
- Teams not ready for TypeScript
- Learning Vitek with React
- Progressive enhancement from basic-js

**Tech Stack:**

- JavaScript
- React
- Vite
- JSX

---

### [typescript-react](./typescript-react/)

**Complete TypeScript with React**

The most comprehensive example showcasing all Vitek features with full type-safety and advanced patterns.

**Key Features:**

- ✅ Complete TypeScript setup
- ✅ Full type-safety (auto-generated types)
- ✅ React with TypeScript
- ✅ Hierarchical middlewares
- ✅ All HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- ✅ Dynamic parameters (`[id]`, `[...ids]`)
- ✅ Typed Body and Query parameters
- ✅ Generated TypeScript services (`api.services.ts`)
- ✅ Response helpers (custom status codes and headers)
- ✅ HTTP error classes
- ✅ Request validation
- ✅ WebSocket sockets (index.socket.ts, chat.socket.ts)

**Best for:**

- Production-ready applications
- Teams using TypeScript
- Learning all Vitek features
- Reference implementation

**Tech Stack:**

- TypeScript
- React
- Vite
- TSX

---

### [docker](./docker/)

**TypeScript + React with Docker and docker-compose**

Same app as typescript-react, runnable in a container. Uses pnpm for install and scripts. No database.

**Key Features:**

- ✅ Same as typescript-react (TypeScript, React, full type-safety, WebSockets)
- ✅ Dockerfile and docker-compose for containerized dev
- ✅ pnpm for install and run inside the container
- ✅ No database or extra services

**Best for:**

- Containerized development or deployment
- Teams standardizing on Docker
- CI environments

**Tech Stack:**

- TypeScript, React, Vite, TSX
- Docker, docker-compose, pnpm

**Run with Docker (dev):** From `examples/docker`, run `docker compose up --build`, then open `http://localhost:5173`. This runs the development server only. No need to build the plugin from the repo root. For production in Docker (build + vitek-serve), see [docker README](./docker/README.md) ("Production with Docker").

---

### [prisma](./prisma/)

**REST API with Prisma ORM and SQLite**

File-based routes with Prisma for database access. No framework—pure API.

**Key Features:**

- ✅ Prisma ORM with SQLite
- ✅ REST API (GET /api/users, POST /api/users, GET /api/users/:id)
- ✅ OpenAPI docs
- ✅ TypeScript

**Best for:**

- API-only apps with a database
- Learning Vitek + Prisma
- Backends without frontend framework

**Tech Stack:**

- TypeScript, Vite, Prisma, SQLite, Vitek

---

### [rate-limit](./rate-limit/)

**In-memory rate limiting via plugin**

Minimal example using a `beforeApiRequest` plugin to limit requests per IP (10 per minute). See [Plugin API – Recipes (rate limiting)](../docs/guide/plugin-api.md#rate-limiting-in-memory-by-ip).

**Key Features:**

- ✅ Pure JavaScript
- ✅ Rate limit plugin (429 after limit)
- ✅ Single route: GET /api/health

**Best for:**

- Learning how to add rate limiting with a plugin
- Reference for in-memory rate limiting (production: use Redis or proxy)

**Tech Stack:**

- JavaScript
- Vite

---

## 🚀 Quick Start

### Prerequisites

Before running any example, you need to build the Vitek plugin:

```bash
# From the project root (vitek-plugin/)
npm run build
# or
pnpm build
```

### Running an Example

1. Navigate to the example directory:

   ```bash
   cd examples/socket-only  # or basic-js, js-react, typescript-react
   ```

   **docker:** From `examples/docker`, run `docker compose up --build` (uses pnpm inside the container). No need to build the plugin from the repo root.

2. Install dependencies (skip for docker):

   ```bash
   npm install
   # or
   pnpm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Open your browser:
   - Visit `http://localhost:5173`
   - Check the console for API route information

   For production-style (static + API), run **`pnpm run build`** then **`pnpm run start`** (vitek-serve). `vite preview` is for quick local preview of the static build only.

---

## 📊 Comparison Table

| Feature                | socket-only     | basic-js       | js-react       | typescript-react | import-external | api-docs   | prisma     | docker     | rate-limit   |
| ---------------------- | --------------- | -------------- | -------------- | ---------------- | -------------- | ---------- | ---------- | ---------- | ------------ |
| **Focus**              | WebSockets only | HTTP + Sockets | HTTP + Sockets | HTTP + Sockets   | External libs  | OpenAPI    | Prisma DB  | Docker     | Rate limit   |
| **Language**           | JavaScript      | JavaScript     | JavaScript     | TypeScript       | TypeScript     | TypeScript | TypeScript | TypeScript | JavaScript  |
| **Framework**          | None            | None           | React          | React            | None           | None       | None       | React      | None        |
| **Type Safety**        | ❌              | ❌             | ❌             | ✅               | ✅             | ✅         | ✅         | ✅         | ❌          |
| **OpenAPI**            | ❌              | ❌             | ❌             | ❌               | ❌             | ✅         | ✅         | ❌         | ❌          |
| **Database**           | ❌              | ❌             | ❌             | ❌               | ❌             | ❌         | ✅ Prisma  | ❌         | ❌          |
| **Generated Services** | ✅ (socket)     | ✅ (JS)        | ✅ (JS)        | ✅ (TS)          | ✅ (TS)        | ✅ (TS)    | ✅ (TS)    | ✅ (TS)    | ✅ (JS)     |
| **Docker**             | ❌              | ❌             | ❌             | ❌               | ❌             | ❌         | ❌         | ✅         | ❌          |
| **WebSockets**         | ✅              | ✅             | ✅             | ✅               | ❌             | ❌         | ❌         | ✅         | ❌          |
| **Complexity**         | ⭐              | ⭐             | ⭐⭐           | ⭐⭐⭐           | ⭐⭐           | ⭐⭐        | ⭐⭐⭐      | ⭐⭐⭐     | ⭐          |
| **Best For**           | WebSockets      | Learning       | React (JS)     | Production       | Shared libs    | API docs   | DB-backed  | Docker     | Rate limit  |

---

## 🎯 Which Example Should I Use?

### Start with `socket-only` if:

- You want to focus on WebSockets
- You're building a real-time app (chat, live updates)
- You want the simplest socket example

### Start with `basic-js` if:

- You're new to Vitek
- You want to understand the fundamentals
- You prefer simplicity
- You don't need a framework

### Use `js-react` if:

- You're building a React app
- You prefer JavaScript over TypeScript
- You want to see React integration
- You need a middle ground between basic and advanced

### Use `typescript-react` if:

- You're building a production app
- You want full type-safety
- You need all Vitek features
- You want the complete reference implementation

### Use `import-external` if:

- You want to import shared code from outside `src/api`
- You're structuring libs or shared utilities
- You need to see how external imports work with Vitek

### Use `api-docs` if:

- You want OpenAPI/Swagger documentation
- You're building API-first or documenting your API
- You need the minimal setup for API docs

### Use `prisma` if:

- You're building a REST API with a database
- You want to see Vitek + Prisma + SQLite
- You need a backend-only example without frontend

### Use `docker` if:

- You want to run the app in a container
- You're standardizing on Docker
- You need containerized dev or CI

### Use `rate-limit` if:

- You want to add in-memory rate limiting via a plugin
- You need a reference for `beforeApiRequest` with 429 responses
- You're evaluating rate limiting before moving to Redis or proxy

### Additional examples

- **[validation-only](./validation-only/)** — `validateBody` and 422 on invalid body
- **[error-handling](./error-handling/)** — custom `onError` and route that throws
- **[cors](./cors/)** — CORS with restricted origin, methods, headers
- **[minimal-ts](./minimal-ts/)** — minimal TypeScript, one GET route, no React
- **[build-api-false](./build-api-false/)** — API only in dev, no bundle in `dist/`
- **[alias](./alias/)** — `alias: { '@lib': 'src/lib' }` in routes

---

## 📁 Example Structure

Each example follows a similar structure:

```
example-name/
├── src/
│   ├── api/                  # API routes + sockets (file-based)
│   │   ├── *.get.js/ts       # GET endpoints
│   │   ├── *.post.js/ts      # POST endpoints
│   │   ├── *.socket.js/ts    # WebSocket endpoints (/ws/*)
│   │   └── middleware.js/ts  # Middlewares (if applicable)
│   ├── api.services.js/ts    # Generated HTTP services
│   ├── socket.services.js/ts # Generated socket services
│   ├── api.types.ts          # Generated types (TypeScript only)
│   └── App.jsx/tsx           # Main component (React examples)
├── index.html                # Entry HTML
├── vite.config.js/ts         # Vite configuration
├── package.json              # Dependencies
└── README.md                 # Example-specific documentation
```

---

## Using outside the examples folder

In your own project (outside this examples folder), after installing the plugin with `npm install vitek-plugin` or `pnpm add vitek-plugin`, you can run the production server (static + API) like this:

In `package.json`:

```json
"scripts": {
  "start": "vitek-serve"
}
```

Then: `pnpm run build` and `pnpm start`. To expose on all interfaces (e.g. Docker): `vitek-serve --port=5173 --host=0.0.0.0`.

Alternative (direct CLI path): `"start": "node ./node_modules/vitek-plugin/dist/cli/serve.js"`.

In the examples we use `vitek-serve`; you must run `pnpm build` at the plugin root before `pnpm start` when the plugin is linked as `file:../..`.

---

## 🔗 Links

- [Main README](../README.md) - Full Vitek documentation
- [socket-only README](./socket-only/README.md) - WebSocket-only example
- [basic-js README](./basic-js/README.md) - Detailed basic-js documentation
- [js-react README](./js-react/README.md) - Detailed js-react documentation
- [typescript-react README](./typescript-react/README.md) - Detailed typescript-react documentation
- [docker README](./docker/README.md) - TypeScript + React with Docker and docker-compose (pnpm)
- [api-docs README](./api-docs/README.md) - API docs (REST + WebSockets)
- [prisma README](./prisma/README.md) - Prisma ORM + SQLite
- [rate-limit README](./rate-limit/README.md) - In-memory rate limiting via plugin
- [validation-only README](./validation-only/README.md) - validateBody and 422
- [error-handling README](./error-handling/README.md) - onError and thrown errors
- [cors README](./cors/README.md) - CORS options
- [minimal-ts README](./minimal-ts/README.md) - Minimal TypeScript
- [build-api-false README](./build-api-false/README.md) - buildApi: false
- [alias README](./alias/README.md) - alias option

---

## 💡 Tips

1. **Start Simple**: Begin with `basic-js` to understand the core concepts
2. **Build the Plugin First**: Build the plugin from the root before running examples (except **docker**, which uses the published npm package)
3. **Production server**: Run `pnpm run build` then `pnpm run start` (vitek-serve) in any example to serve static + API
4. **Check the Console**: Vitek logs useful information about registered routes
5. **Explore Generated Files**: Look at `api.services.js/ts` to see how services are generated
6. **Try Modifying Routes**: Add new routes and see them appear automatically

---

## 🐛 Troubleshooting

### Plugin not found

**Solution**: Make sure you've built the plugin from the project root:

```bash
cd ../..
npm run build
```

### Routes not working

**Solution**:

- Check that your route files follow the naming convention: `[name].[method].ts/js`
- Ensure the file exports a default handler function
- Check the browser console for error messages

### Types not generating (TypeScript projects)

**Solution**:

- Ensure `tsconfig.json` exists in the example directory
- Check that route files have proper TypeScript syntax
- Restart the dev server

### CLI not found when running `pnpm start`

**Solution**: Run `pnpm build` in the plugin root (`vitek-plugin/`), then run `pnpm start` again in the example. The start script runs `vitek-serve` (the plugin's bin); the CLI (`dist/cli/serve.js`) exists only after the plugin is built.

### Docker example: `vitek-serve` not found or CLI missing

**Solution**: The Docker example assumes the published npm package includes the CLI. Either publish a new version after running `pnpm build` at the plugin root, or for local testing use `"vitek-plugin": "file:../.."` in the docker example and build the plugin at repo root.

---

## 🤝 Contributing

Found an issue with an example? Want to add a new example? Contributions are welcome!

1. Check existing examples for patterns
2. Follow the same structure and conventions
3. Update this README with your new example
4. Submit a pull request

---

<div align="center">
  <p>Happy coding with Vitek! 🚀</p>
</div>
