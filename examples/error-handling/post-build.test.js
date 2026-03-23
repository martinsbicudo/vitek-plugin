import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('error-handling example', () => {
  it('dist and bundle exist', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek-api.mjs'))).toBe(true);
  });

  it('resolves vitek-plugin subpath exports', async () => {
    const { NotFoundError } = await import('vitek-plugin/errors');
    expect(typeof NotFoundError).toBe('function');
    const { vitek } = await import('vitek-plugin/plugin');
    expect(typeof vitek).toBe('function');
  });

  it('fail route throws', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-api.mjs')).href);
    const route = mod.routes.find((r) => r.pattern === 'fail' && r.method === 'get');
    expect(route).toBeDefined();
    const handler = typeof route.handler === 'function' ? route.handler : route.handler.default;
    const ctx = { params: {}, query: {}, headers: {}, url: '', method: 'get', path: '/api/fail' };
    try {
      await handler(ctx);
      expect.fail('expected handler to throw');
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe('Intentional failure');
    }
  });
});
