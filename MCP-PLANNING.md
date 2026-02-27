# MCP Planning for Vitek

This document describes the full plan to add **Model Context Protocol (MCP)** support in two areas: a Vitek product MCP (for AIs to use the framework) and a per-project MCP (for AIs to integrate with the API built with Vitek).

---

## 1. Overview

| Area | Goal | Audience | When to use |
|------|------|----------|-------------|
| **Vitek MCP** | Help AIs *build and modify* backends with Vitek | Any Vitek user with Cursor, Claude Desktop, etc. | When asking the AI to create routes, middlewares, sockets, validation, etc. |
| **Project API MCP** | Help AIs *integrate with* the project's API (routes, types, calls) | Front-end or other service developer consuming the Vitek API | When asking the AI to call endpoints, type requests, or document integration |

Both areas are complementary and can be implemented in parallel or in sequence.

---

## 2. Vitek MCP (product)

### 2.1 Goal and value

- Expose Vitek knowledge and capabilities via MCP so assistants (Cursor, Claude Desktop, other MCP clients) can:
  - Suggest code that follows Vitek conventions (file naming, `VitekContext`, response helpers, validation).
  - Create routes `[name].[method].ts`, middlewares, sockets `.socket.ts`, and plugin configuration.
  - Query documentation and examples without relying only on the trained model.

### 2.2 Functional scope

#### 2.2.1 Resources (read-only)

| Resource URI | Description | Suggested content |
|--------------|-------------|-------------------|
| `vitek://docs/routing` | Routing conventions | Naming `[param].get.ts`, `[...rest].get.ts`, patterns, `apiDir`, `apiBasePath` |
| `vitek://docs/middlewares` | Middlewares | Structure of `middleware.ts`, `basePattern`, application order, `next()` |
| `vitek://docs/websockets` | WebSockets | `.socket.ts` files, `VitekSocketContext`, `sockets` in context, base path |
| `vitek://docs/context` | Context and request | `VitekContext`, `VitekRequest`, `path`, `params`, `query`, `body`, `headers`, `clientIp` |
| `vitek://docs/response` | Responses | `VitekResponse`, helpers `ok`, `created`, `notFound`, `json`, `redirect`, etc. |
| `vitek://docs/validation` | Validation | `validate`, `validateBody`, `validateQuery`, `ValidationSchema`, `enableValidation` |
| `vitek://docs/errors` | HTTP errors | `HttpError`, `BadRequestError`, `ValidationError`, etc., and `onError` |
| `vitek://docs/plugin-api` | Plugin API | `VitekPlugin`, `afterTypesGenerated`, `beforeApiRequest`, context types |
| `vitek://docs/configuration` | Configuration | `VitekOptions`: `apiDir`, `openApi`, `cors`, `sockets`, `alias`, `maxBodySize`, etc. |
| `vitek://docs/introspection` | Introspection | `getManifest`, `getRoutes`, `getSockets`, `writeManifest`, manifest format |

Each resource can be generated from the current docs (docs/) and types exported in `src/index.ts`, keeping them in sync with the package version.

#### 2.2.2 Tools (actions)

| Tool | Description | Inputs | Behavior |
|------|-------------|--------|----------|
| `vitek_create_route` | Create route skeleton | `path` (e.g. `users/[id]`), `method` (get, post, put, patch, delete, options), optional `apiDir` | Returns code snippet and suggested file path (e.g. `src/api/users/[id].get.ts`) |
| `vitek_create_middleware` | Create middleware skeleton | `basePattern` (e.g. `users` or empty for global), optional `apiDir` | Returns snippet and file path |
| `vitek_create_socket` | Create socket skeleton | `pattern` (e.g. `chat`), optional `apiDir` | Returns snippet and file path |
| `vitek_suggest_vite_config` | Suggest Vite + Vitek config | Optional `options` (openApi, cors, apiDir, etc.) | Returns snippet for `vite.config.ts` |
| `vitek_validate_convention` | Validate file path convention | `filePath` (e.g. `src/api/users/[id].get.ts`) | Returns whether it is a valid route, middleware or socket and which method/pattern |

Optional tools for later phases: `vitek_add_validation_to_route`, `vitek_generate_openapi_snippet`.

### 2.3 Technical architecture

- **Runtime:** Node.js (LTS), no Vite dependency in the MCP process.
- **Protocol:** MCP (Model Context Protocol) over stdio or SSE, as per chosen SDK.
- **Implementation:** MCP server in a separate package (e.g. `vitek-mcp` or `@vitek/mcp`) that:
  - Uses the official MCP SDK (e.g. `@modelcontextprotocol/sdk` in TypeScript/Node).
  - Implements handlers for the resources and tools listed above.
  - Reads documentation and metadata from the installed `vitek-plugin` package (or embedded bundle) to stay compatible with the version.

- **NPM package:** Publish `vitek-mcp` (or name TBD) with `bin` for running via `npx vitek-mcp` or as the server command in MCP clients (Cursor, Claude).

### 2.4 Dependencies and deliverables

- Dependency: MCP SDK for Node (e.g. `@modelcontextprotocol/sdk`).
- Deliverables:
  - Repo or subfolder `packages/vitek-mcp` with the MCP server.
  - Stable, documented list of resources and tools.
  - Installation docs (Cursor, Claude Desktop, etc.) and versioning aligned with `vitek-plugin`.

### 2.5 Acceptance criteria (Vitek MCP)

- [x] MCP server starts and exposes the defined resources and tools.
- [x] MCP client (e.g. Cursor) can read at least one resource and invoke a tool.
- [x] Resource content is aligned with the docs and Vitek public API for the corresponding version.
- [x] README with configuration instructions for at least one client (e.g. Cursor).

**Implementation (Phase 1 + 2):** The Vitek MCP server lives in `packages/vitek-mcp`. It includes the 10 resources (routing, context, response, middlewares, websockets, validation, errors, plugin-api, configuration, introspection) and the 5 tools (`vitek_create_route`, `vitek_create_middleware`, `vitek_create_socket`, `vitek_suggest_vite_config`, `vitek_validate_convention`). See `packages/vitek-mcp/README.md` for installation (Cursor, Claude Desktop) and usage.

---

## 3. Project API MCP (per project)

### 3.1 Goal and value

- In a project that already uses Vitek, expose that *project's API* (routes, methods, params, and when possible types/schemas) to the AI helping in the same repo (e.g. front-end or another service).
- Reduces integration mistakes (wrong paths, wrong methods, malformed bodies) and avoids manually pasting OpenAPI or types into context.

### 3.2 Functional scope

#### 3.2.1 Data sources

- **Manifest:** `getManifest(root, apiDir)` already exposes `routes`, `middlewares`, `sockets` with `method`, `pattern`, `params`, `file`.
- **OpenAPI:** If the project has `openApi: true`, the spec is already generated; it can be read from file or generated on demand.
- **Generated types:** `api.types.ts` / `api.services.ts` (or configurable names) generated by Vitek; can be read to enrich resources with body/query types when available.

#### 3.2.2 Resources (read-only)

| Resource URI | Description | Source |
|--------------|-------------|--------|
| `vitek-api://manifest` | Full manifest (routes, middlewares, sockets) | `getManifest(root, apiDir)` |
| `vitek-api://routes` | Routes list with method, pattern, params, file | `manifest.routes` |
| `vitek-api://sockets` | Sockets list with pattern, params, file | `manifest.sockets` |
| `vitek-api://openapi` | OpenAPI 3.0 spec (if available) | Generated file or `generateOpenApiSpec` with current data |
| `vitek-api://asyncapi` | AsyncAPI spec (if sockets exist) | Generated file or equivalent |

The project MCP server must resolve `root` and `apiDir` from the working directory or a config file (e.g. `vitek.mcp.json` or option in `vite.config` / `vitek.config.mjs`).

#### 3.2.3 Tools (actions) – optional

| Tool | Description | Inputs | Behavior |
|------|-------------|--------|----------|
| `vitek_api_call` | Call a local API endpoint | `method`, `path` (relative to apiBasePath), optional `body`, optional `headers` | Sends HTTP request to configurable base URL (e.g. `http://localhost:5173`) and returns status and body. Useful for the AI to test or demonstrate calls. |

Risk: the API must be running (dev or serve). Document that the tool only works with the server up; otherwise return a clear error.

### 3.3 Activation and execution mode

- **Where it lives:** In the user's project, not in the main package. Two options:
  - **A)** Command in the Vitek CLI: `vitek mcp` (or `vitek-mcp-dev`) that starts an MCP server (stdio or SSE) with project context (root, apiDir, openApi, etc.).
  - **B)** Separate package `vitek-mcp-dev` installable in the project, with script `"mcp": "vitek-mcp-dev"` and the user configures the MCP client to run that command in the project cwd.

- **Project configuration:**
  - Read `apiDir` (and optionally `apiBasePath`, `openApi`) from `vite.config` or `vitek.config.mjs` / `vitek.mcp.json` to avoid duplicating config.
  - If there is no Vite config in cwd, use defaults (e.g. `src/api`) and document.

### 3.4 Technical architecture

- **Runtime:** Node.js.
- **Protocol:** MCP over stdio (recommended for local dev) or SSE.
- **Implementation:**
  - MCP server that imports `getManifest`, `getRoutes`, `getSockets` (and when possible `generateOpenApiSpec` or reads file) from `vitek-plugin`.
  - Resources read from disk and/or call introspection functions; OpenAPI can be generated in memory or read from a previous build (with a warning if outdated).
- **Security:** Server intended for development; do not expose on a public network. Option to bind only to localhost if using SSE.

### 3.5 Acceptance criteria (Project API MCP)

- [x] Command or script starts the MCP server in the project directory and exposes `vitek-api://manifest` (and at least `routes` / `sockets`).
- [x] MCP client can read the manifest and list the project's routes/sockets.
- [x] If the project has OpenAPI enabled, resource `vitek-api://openapi` returns a valid spec (or indicates how to generate it).
- [x] Documentation explains how to configure the client (e.g. Cursor) to use this MCP in the project repo.
- [x] (Optional) Tool `vitek_api_call` works when the API is running and base URL is configured.

**Implementation (Phase 3):** The `vitek mcp` command in the vitek-plugin CLI starts the MCP server in cwd. Optional config in `vitek.mcp.json` (apiDir, apiBasePath, socketBasePath, baseUrl). Resources: `vitek-api://manifest`, `routes`, `sockets`, `openapi`, `asyncapi`. Tool `vitek_api_call` to call the local API. Documentation in [docs/guide/mcp-project.md](docs/guide/mcp-project.md).

---

## 4. Suggested schedule (phases)

### Phase 1 – Foundation (Vitek MCP)

1. Create package/repo for the Vitek MCP server.
2. Integrate MCP SDK; expose 2–3 documentation resources and 1 tool (e.g. `vitek_create_route`).
3. Document installation for one client (Cursor).
4. Validate with internal or beta users.

### Phase 2 – Full Vitek MCP

1. Complete all planned resources and tools.
2. Align content with Vitek docs and API; automate content generation from docs/types when possible.
3. Publish NPM package and announce.

### Phase 3 – Project API MCP

1. Define command (`vitek mcp`) or package (`vitek-mcp-dev`) and config contract (vite.config / vitek.config.mjs / vitek.mcp.json).
2. Implement MCP server that uses `getManifest`, `getRoutes`, `getSockets` and OpenAPI when present.
3. Expose resources `manifest`, `routes`, `sockets`, `openapi`.
4. Document configuration in the project and in the MCP client.
5. (Optional) Implement tool `vitek_api_call` and document requirements (server running, base URL).

### Phase 4 – Refinements

1. ~~AsyncAPI support in Project API MCP (resource `vitek-api://asyncapi`).~~ (already included in Phase 3)
2. UX improvements: clear messages when OpenAPI is unavailable or outdated. (optional; OpenAPI/AsyncAPI are generated on demand)
3. ~~Automated tests for both MCP servers (resources and tools).~~ Unit tests added: `packages/vitek-mcp/src/tools/*.test.ts` (create-route, create-middleware, create-socket, suggest-vite-config, validate-convention) and `src/cli/mcp-project-config.test.ts`.

---

## 5. Risks and dependencies

- **MCP evolving:** Protocol and SDK may change; keep dependency on a stable version and follow the changelog.
- **Content maintenance:** Vitek MCP resources must track documentation and API changes; consider generating from docs and types to reduce drift.
- **Discovery:** The vitek-plugin README and docs mention MCP; `vitek init` shows a tip at the end: "Tip: expose your API to AI assistants with `vitek mcp`".

---

## 6. Success metrics

- Number of installations or references to the Vitek MCP package.
- Fewer issues/PRs with code that breaks Vitek conventions (misnamed routes, incorrect context usage).
- Qualitative feedback: developers can ask the AI to create routes/sockets and get usable code; integration with the project API is faster with the Project API MCP.

---

## 7. References

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [MCP SDK (TypeScript/Node)](https://github.com/modelcontextprotocol/typescript-sdk)
- Vitek docs: [docs/](../), [Introspection](../guide/introspection.md), [Plugin API](../guide/plugin-api.md), [OpenAPI](../guide/openapi.md)
- Code: `getManifest`, `getRoutes`, `getSockets` in `src/core/introspection/manifest.ts`; `VitekManifest` and types in `src/index.ts`
