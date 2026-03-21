# Getting Started

## Quick start with `npx vitek init`

In a new or existing Vite project, run:

```bash
npx vitek init
```

This creates `src/api` (if missing), adds a sample `src/api/health.get.ts`, and injects `vitek()` into your `vite.config.js` or `vite.config.ts` if found. Use `npx vitek init --force` to overwrite the sample file. Then run `npm run dev` and open `http://localhost:5173/api/health`.

---

## 1. Configure the Plugin

Add Vitek to your `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import { vitek } from "vitek-plugin/plugin";

export default defineConfig({
  plugins: [vitek()],
});
```

## 2. Create Your First Route

Create `src/api/health.get.ts`:

```typescript
import type { VitekContext } from "vitek-plugin";

export default function handler(context: VitekContext) {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
}
```

## 3. Start the Development Server

```bash
npm run dev
```

Visit: `http://localhost:5173/api/health`

That's it. Vitek will serve your API under the `/api` path and reload on file changes.

## 4. Run the built app

To run the built app with the API (production mode), add `"start": "vitek-serve"` to your `package.json` scripts, then:

```bash
npm run build
npm start
```

(or `pnpm start`). Open `http://localhost:3000/api/health` (or the port you set). See [Production server](/guide/production-server) for options and details.
