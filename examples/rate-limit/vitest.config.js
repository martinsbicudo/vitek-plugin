import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.js'],
  },
  resolve: {
    alias: {
      'vitek-plugin': resolve(__dirname, '../..'),
    },
  },
});
