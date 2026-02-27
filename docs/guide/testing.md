# Testing

Vitek Plugin includes a comprehensive test suite using [Vitest](https://vitest.dev/).

## Overview

- **Framework:** Vitest
- **Coverage:** v8 provider
- **Total Tests:** 133
- **Coverage Report:** [View Online](https://martinsbicudo.github.io/vitek-plugin/coverage/)

## Running Tests

### Run once
```bash
pnpm test
```

### Run in watch mode (development)
```bash
pnpm test:watch
```

### Run with coverage
```bash
pnpm test:coverage
```

## Coverage Thresholds

We maintain high code quality standards with the following coverage thresholds:

| Metric | Minimum | Current |
|--------|---------|---------|
| Lines | 55% | — |
| Functions | 60% | — |
| Branches | 50% | — |
| Statements | 55% | — |

**Note:** Pull requests that reduce coverage below these thresholds will fail CI checks.

## Test Structure

### Unit tests (src/)

Unit tests for the plugin core live in `src/` alongside the source code:

```
src/
├── core/
│   ├── introspection/
│   │   └── manifest.test.ts         # getManifest, getRoutes, getSockets, writeManifest
│   ├── middleware/
│   │   └── compose.test.ts          # Middleware composition tests
│   ├── normalize/
│   │   └── normalize-path.test.ts   # Path normalization tests
│   └── routing/
│       ├── route-matcher.test.ts    # Route matching tests
│       └── route-parser.test.ts     # Route parsing tests
├── plugin/
│   ├── vitek-config.test.ts         # Config plugin (optimizeDeps, alias)
│   └── ...
└── shared/
    ├── errors.test.ts               # Error classes tests
    └── response-helpers.test.ts     # HTTP response tests
```

### Post-build tests (examples/)

Each example includes `post-build.test.ts` (or `.js`) that runs after `vite build` to verify:

- Generated files exist (`api.services.*`, `api.types.*`, `socket.services.*`)
- `dist/vitek-api.mjs` and `dist/vitek-sockets.mjs` bundles load correctly
- Routes and middlewares are exported as expected

Run: `pnpm run build && pnpm test` from each example directory. The [build-and-test.sh](../../examples/build-and-test.sh) script runs this for all examples (including rate-limit).

### E2E test

An end-to-end test builds the plugin and the **basic-js** example, starts **vitek-serve**, and sends GET and POST requests to the API:

```bash
pnpm test:e2e
```

This runs `scripts/e2e.mjs`. Ensure the plugin is buildable and that `examples/basic-js` can be built (e.g. after `pnpm build` at repo root).

### Benchmark

A simple benchmark script sends many requests to a URL and reports latency (p50, p99) and throughput (req/s):

```bash
pnpm bench
# or with custom URL and count:
node scripts/bench.mjs http://127.0.0.1:3000/api/health 5000
```

Default URL is `http://127.0.0.1:3000/api/health` and default count is 1000. Start a server (e.g. from an example) before running the benchmark.

## Writing Tests

Tests follow the naming convention: `[filename].test.ts`

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { parseRouteFile } from './route-parser.js';

describe('parseRouteFile', () => {
  it('should parse a simple GET route', () => {
    const result = parseRouteFile('/api/health.get.ts', '/api');
    expect(result).toEqual({
      method: 'get',
      pattern: 'health',
      params: [],
      file: '/api/health.get.ts',
    });
  });
});
```

## Continuous Integration

Tests run automatically on every Pull Request via GitHub Actions:

- **Workflow:** `.github/workflows/pr_tests_check.yml`
- **Triggers:** PR opened, reopened, synchronized
- **Requirements:** All tests must pass + coverage thresholds met

## Coverage Report

The coverage report is automatically generated and deployed to GitHub Pages on every push to `main`:

🔗 **[View Coverage Report](https://martinsbicudo.github.io/vitek-plugin/coverage/)**

You can also find the link in the top navigation menu of the documentation.

## Configuration

Test configuration is in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    name: 'vitek-plugin',
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 55,
        functions: 60,
        branches: 50,
        statements: 55,
      },
    },
  },
});
```

## Best Practices

1. **Write tests for new features** - Every new feature should include tests
2. **Maintain coverage** - Don't let coverage drop below thresholds
3. **Test edge cases** - Include tests for error conditions and edge cases
4. **Use descriptive names** - Test descriptions should clearly state what's being tested
5. **Keep tests focused** - One logical assertion per test when possible

## Contributing

When contributing:

1. Ensure all tests pass: `pnpm test`
2. Check coverage: `pnpm test:coverage`
3. Add tests for new functionality
4. Don't break existing tests without good reason

See [Contributing Guide](/contributing) for more details.
