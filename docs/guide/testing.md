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
| Lines | 80% | 92.8% |
| Functions | 80% | 90.47% |
| Branches | 75% | 92.42% |
| Statements | 80% | 92.68% |

**Note:** Pull requests that reduce coverage below these thresholds will fail CI checks.

## Test Structure

```
src/
├── core/
│   ├── middleware/
│   │   └── compose.test.ts          # Middleware composition tests
│   ├── normalize/
│   │   └── normalize-path.test.ts   # Path normalization tests
│   └── routing/
│       ├── route-matcher.test.ts    # Route matching tests
│       └── route-parser.test.ts     # Route parsing tests
└── shared/
    ├── errors.test.ts               # Error classes tests
    └── response-helpers.test.ts     # HTTP response tests
```

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
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
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
