import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: { include: ['post-build.test.ts'], environment: 'node' },
  resolve: { alias: { 'vitek-plugin': resolve(__dirname, '../../dist/index.js') } },
});
