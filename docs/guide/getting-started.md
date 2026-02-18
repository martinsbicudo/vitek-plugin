# Getting Started

## 1. Configure the Plugin

Add Vitek to your `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import { vitek } from "vitek-plugin";

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
