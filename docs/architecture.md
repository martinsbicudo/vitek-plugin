# Architecture

Vitek follows a modular architecture so that core logic is independent of Vite and can be reused in other runtimes (e.g. standalone Node.js or other bundlers).

## Layers

- **Core** - Logic independent of Vite (file scanning, routing, middleware composition, validation, type generation).
- **Adapters** - Integration with specific runtimes (currently Vite only).
- **Plugin** - Thin layer that registers the plugin in Vite and wires the adapter.

## Directory Structure

```
vitek-plugin/
├── src/
│   ├── core/                    # Runtime-agnostic core logic
│   │   ├── context/             # Context creation (VitekContext, etc.)
│   │   ├── file-system/         # File scanning and watching
│   │   ├── middleware/          # Middleware composition
│   │   ├── normalize/           # Path normalization ([id] → :id, etc.)
│   │   ├── routing/             # Route parsing and matching
│   │   ├── types/               # Type and service generation
│   │   └── validation/          # Request validation
│   ├── adapters/
│   │   └── vite/                # Vite dev server integration
│   ├── shared/
│   │   ├── errors.ts            # Error classes
│   │   └── response-helpers.ts  # Response helper functions
│   └── plugin.ts                # Vite plugin entry point
```

Each core module has a single responsibility; the Vite adapter uses them to serve routes and generate types during development.
