# Vitek vs. Other Solutions

## Framework-Specific Solutions

### Next.js API Routes

- **Next.js**: Requires Next.js framework, tightly coupled to React ecosystem.
- **Vitek**: Framework-agnostic, works with any frontend (React, Vue, Svelte, vanilla JS).
- **Vitek advantage**: More flexible, lighter, not tied to a specific framework.

### SvelteKit API Routes

- **SvelteKit**: Requires SvelteKit framework, Svelte-specific.
- **Vitek**: Works with any frontend framework or no framework at all.
- **Vitek advantage**: Universal solution, not limited to Svelte projects.

### Nuxt.js Server Routes

- **Nuxt.js**: Vue.js-specific, requires Nuxt framework.
- **Vitek**: Framework-independent, works with any stack.
- **Vitek advantage**: Can be used in any Vite project.

---

## Standalone Backend Solutions

### Express.js / Fastify

- **Express/Fastify**: Separate Node.js server, requires server setup and configuration.
- **Vitek**: Integrated with Vite dev server, no separate server needed.
- **Vitek advantage**: Simpler setup, unified development environment, automatic hot reload.

### Hono

- **Hono**: Fast web framework, but still requires separate server setup.
- **Vitek**: File-based routing with automatic type generation, integrated with Vite.
- **Vitek advantage**: Better DX with file-based routing, automatic client generation.

### tRPC

- **tRPC**: Type-safe RPC framework, requires separate server setup.
- **Vitek**: File-based REST API with automatic type generation, integrated with Vite.
- **Vitek advantage**: Simpler setup, standard REST API, works with any HTTP client.

---

## Full-Stack Frameworks

### Remix

- **Remix**: Full-stack React framework with server-side rendering.
- **Vitek**: Lightweight API layer, works with any frontend.
- **Vitek advantage**: More flexible, lighter, not tied to React or SSR.

---

## Why Choose Vitek?

**Choose Vitek if you:**

- Want to add API routes to an existing Vite project
- Prefer file-based routing over manual route registration
- Want automatic type generation for your API
- Need a lightweight solution without framework lock-in
- Want unified development (frontend + backend in one server)
- Prefer REST APIs over RPC or GraphQL
- Want zero configuration and minimal setup

**Consider alternatives if you:**

- Need server-side rendering (use Next.js, Remix, or SvelteKit)
- Want GraphQL (use Apollo Server or similar)
- Need advanced features like WebSockets out of the box (use Express/Fastify with Socket.io)
- Are building a full-stack framework from scratch (use Hono, Express, or Fastify)
- Need production-ready server features (use Express, Fastify, or Hono with proper setup)

**Vitek's sweet spot:** Adding API routes to Vite projects with minimal configuration, automatic type safety, and excellent developer experience.
