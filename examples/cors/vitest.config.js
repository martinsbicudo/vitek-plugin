import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['post-build.test.js'], environment: 'node' },
});
