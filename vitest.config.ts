import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'vitek-plugin',
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        'docs/',
        'examples/',
      ],
    },
    include: ['src/**/*.test.ts'],
  },
});
