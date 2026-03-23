import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['post-build.test.ts', 'health.handler.test.ts'], environment: 'node' },
});
