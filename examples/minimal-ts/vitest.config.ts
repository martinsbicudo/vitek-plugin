import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: { include: ['post-build.test.ts', 'health.handler.test.ts'], environment: 'node' },
  resolve: {
    alias: [
      { find: 'vitek-plugin/testing', replacement: resolve(__dirname, '../../dist/public/testing.js') },
      { find: 'vitek-plugin', replacement: resolve(__dirname, '../../dist/index.js') },
    ],
  },
});
