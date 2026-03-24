import { describe, expect, it } from 'vitest';
import { generateCrudFiles } from './generate-crud.js';

describe('generateCrudFiles', () => {
  it('generates prisma CRUD routes, tests, and contract scaffold', () => {
    const files = generateCrudFiles({
      adapter: 'prisma',
      model: 'User',
      outDir: 'src/api/users',
      root: '/tmp/project',
    });
    expect(files.map((f) => f.path)).toContain('src/api/users/index.get.ts');
    expect(files.map((f) => f.path)).toContain('src/api/users/index.post.ts');
    expect(files.map((f) => f.path)).toContain('src/api/users/[id].get.ts');
    expect(files.map((f) => f.path)).toContain('src/api/users/[id].patch.ts');
    expect(files.map((f) => f.path)).toContain('src/api/users/[id].delete.ts');
    expect(files.map((f) => f.path)).toContain('src/api/users/crud.generated.test.ts');
    expect(files.map((f) => f.path)).toContain('src/api/users/crud.contract.test.ts');
  });

  it('generates drizzle template', () => {
    const files = generateCrudFiles({
      adapter: 'drizzle',
      model: 'Invoice',
      outDir: 'src/api/invoices',
      root: '/tmp/project',
    });
    expect(files.map((f) => f.path)).toContain('src/api/invoices/index.get.ts');
  });

  it('generates sql-first template', () => {
    const files = generateCrudFiles({
      adapter: 'sql',
      model: 'Metric',
      outDir: 'src/api/metrics',
      root: '/tmp/project',
    });
    expect(files.map((f) => f.path)).toContain('src/api/metrics/index.get.ts');
  });
});
