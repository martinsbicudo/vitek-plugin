# Examples

This repository includes three complete examples demonstrating different use cases of the Vitek plugin. Each example is self-contained and can be run independently.

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

## Comparison Table

| Feature | basic-js | js-react | typescript-react |
|---------|----------|----------|------------------|
| Language | JavaScript | JavaScript | TypeScript |
| Framework | None | React | React |
| Type Safety | No | No | Yes |
| Response Helpers | No | No | Yes |
| Error Classes | No | No | Yes |
| Validation | No | No | Yes |
| Generated Types | No | No | Yes |
| Generated Services | Yes (JS) | Yes (JS) | Yes (TS) |
| Middlewares | No | No | Yes |
| HTTP Methods | GET, POST | GET, POST | All methods |
| Complexity | Low | Medium | High |
| Best For | Learning | React (JS) | Production |

---

## Quick Start

1. **Build the plugin** from the project root:
   ```bash
   npm run build
   # or
   pnpm build
   ```

2. **Go to an example** and install:
   ```bash
   cd examples/basic-js   # or js-react, or typescript-react
   npm install
   # or
   pnpm install
   ```

3. **Start the dev server:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. Open your browser at `http://localhost:5173`.

---

## Links to Example READMEs

- [basic-js](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/basic-js) - Detailed basic-js documentation
- [js-react](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/js-react) - Detailed js-react documentation
- [typescript-react](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples/typescript-react) - Detailed typescript-react documentation

---

## Troubleshooting

- **Plugin not found:** Run `npm run build` or `pnpm build` from the repository root, then try the example again.
- **Routes not working:** Ensure route files follow the `[name].[method].ts` or `.js` convention and export a default handler.

For more, see the [examples README](https://github.com/martinsbicudo/vitek-plugin/tree/main/examples) troubleshooting section.
