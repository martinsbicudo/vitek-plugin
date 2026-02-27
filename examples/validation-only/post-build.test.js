import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('validation-only example', () => {
  it('dist and bundle exist', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'dist', 'vitek-api.mjs'))).toBe(true);
  });

  it('echo route validates body and throws 422 for invalid', async () => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'dist', 'vitek-api.mjs')).href);
    const route = mod.routes.find((r) => r.pattern === 'echo' && r.method === 'post');
    expect(route).toBeDefined();
    const handler = typeof route.handler === 'function' ? route.handler : route.handler.default;
    try {
      await handler({ body: {}, params: {}, query: {}, headers: {}, url: '', method: 'post', path: '/api/echo' });
      expect.fail('expected ValidationError');
    } catch (e) {
      expect(e.statusCode).toBe(422);
    }
  });
});
