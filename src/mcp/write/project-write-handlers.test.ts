import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import {
  handleVitekOpenapiSync,
  handleVitekRouteCreate,
  handleVitekRouteUpdate,
  handleVitekTestGenerate,
  handleVitekValidationSuggest,
} from './project-write-handlers.js';

function mkRoot(withWriteEnabled: boolean): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-mcp-write-'));
  fs.mkdirSync(path.join(root, 'src/api'), { recursive: true });
  if (withWriteEnabled) {
    fs.writeFileSync(
      path.join(root, 'vitek.platform.json'),
      JSON.stringify({ features: { mcpWriteTools: true } }, null, 2),
      'utf-8'
    );
  }
  return root;
}

function ctx(root: string) {
  return {
    root,
    apiDir: 'src/api',
    apiBasePath: '/api',
    baseUrl: 'http://localhost:5173',
  };
}

describe('mcp write handlers', () => {
  it('route_create returns dry-run diff by default', () => {
    const root = mkRoot(false);
    const res = handleVitekRouteCreate(ctx(root), {
      routePath: 'health',
      method: 'get',
    });
    expect(res.ok).toBe(true);
    expect(res.dryRun).toBe(true);
    expect(res.diff).toContain('+++ b/src/api/health.get.ts');
  });

  it('route_create writes when apply true and feature enabled', () => {
    const root = mkRoot(true);
    const res = handleVitekRouteCreate(ctx(root), {
      routePath: 'users/[id]',
      method: 'get',
      apply: true,
      dryRun: false,
    });
    expect(res.ok).toBe(true);
    expect(res.written).toBe(true);
    expect(fs.existsSync(path.join(root, 'src/api/users/[id].get.ts'))).toBe(true);
  });

  it('route_update rewrites existing file', () => {
    const root = mkRoot(true);
    const file = path.join(root, 'src/api/health.get.ts');
    fs.writeFileSync(file, 'export default function handler(){ return { ok: true }; }\n', 'utf-8');
    const res = handleVitekRouteUpdate(ctx(root), {
      filePath: 'src/api/health.get.ts',
      content: 'export default function handler(){ return { ok: false }; }\n',
      apply: true,
      dryRun: false,
    });
    expect(res.ok).toBe(true);
    expect(res.written).toBe(true);
    expect(fs.readFileSync(file, 'utf-8')).toContain('ok: false');
  });

  it('validation_suggest injects validateBody', () => {
    const root = mkRoot(true);
    const file = path.join(root, 'src/api/echo.post.ts');
    fs.writeFileSync(file, 'export default async function handler(context){ return context.body; }\n', 'utf-8');
    const res = handleVitekValidationSuggest(ctx(root), {
      filePath: 'src/api/echo.post.ts',
      apply: true,
      dryRun: false,
    });
    expect(res.ok).toBe(true);
    expect(res.written).toBe(true);
    const out = fs.readFileSync(file, 'utf-8');
    expect(out).toContain('validateBody');
  });

  it('test_generate creates a colocated test file', () => {
    const root = mkRoot(true);
    const route = path.join(root, 'src/api/users/[id].get.ts');
    fs.mkdirSync(path.dirname(route), { recursive: true });
    fs.writeFileSync(route, 'export default async function handler(){ return { ok: true }; }\n', 'utf-8');
    const res = handleVitekTestGenerate(ctx(root), {
      routeFilePath: 'src/api/users/[id].get.ts',
      apply: true,
      dryRun: false,
    });
    expect(res.ok).toBe(true);
    expect(res.written).toBe(true);
    expect(fs.existsSync(path.join(root, 'src/api/users/[id].get.test.ts'))).toBe(true);
  });

  it('openapi_sync injects @summary', () => {
    const root = mkRoot(true);
    const file = path.join(root, 'src/api/health.get.ts');
    fs.writeFileSync(file, 'export default async function handler(){ return { ok: true }; }\n', 'utf-8');
    const res = handleVitekOpenapiSync(ctx(root), {
      filePath: 'src/api/health.get.ts',
      apply: true,
      dryRun: false,
    });
    expect(res.ok).toBe(true);
    expect(res.written).toBe(true);
    expect(fs.readFileSync(file, 'utf-8')).toContain('@summary GET health');
  });
});
