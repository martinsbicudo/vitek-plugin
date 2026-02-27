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
      thresholds: {
        lines: 55,
        functions: 60,
        branches: 50,
        statements: 55,
      },
    },
    include: ['src/**/*.test.ts'],
  },
});
