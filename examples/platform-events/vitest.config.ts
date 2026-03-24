import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['post-build.test.ts', 'events-hub.test.ts'], environment: 'node' },
});
