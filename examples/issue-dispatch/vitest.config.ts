import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['post-build.test.ts', 'issues.handler.test.ts'], environment: 'node' },
});
