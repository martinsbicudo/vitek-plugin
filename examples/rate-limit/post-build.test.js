import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

describe('vitek-plugin build outputs (rate-limit)', () => {
  it('dist/ exists with frontend bundle', () => {
    expect(fs.existsSync(path.join(ROOT, 'dist'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'dist', 'index.html'))).toBe(true);
  });

  it('resolves vitek-plugin subpath exports', async () => {
    const { tooManyRequests } = await import('vitek-plugin/response');
    expect(typeof tooManyRequests).toBe('function');
  });

  it('generated api.services.js exists with getHealth', () => {
    const servicesPath = path.join(ROOT, 'src', 'api.services.js');
    expect(fs.existsSync(servicesPath)).toBe(true);
    const content = fs.readFileSync(servicesPath, 'utf-8');
    expect(content).toContain('getHealth');
  });

  it('vitek-api.mjs bundle exists and exposes routes', async () => {
    const apiBundle = path.join(ROOT, 'dist', 'vitek-api.mjs');
    expect(fs.existsSync(apiBundle)).toBe(true);
    const mod = await import(pathToFileURL(apiBundle).href);
    expect(mod.routes).toBeDefined();
    expect(Array.isArray(mod.routes)).toBe(true);
    const healthRoute = mod.routes.find((r) => r.pattern === 'health');
    expect(healthRoute).toBeDefined();
    expect(healthRoute.method?.toLowerCase()).toBe('get');
  });

  it('rate limit plugin returns 429 after max requests per window', async () => {
    const { rateLimitPlugin } = await import(pathToFileURL(path.join(ROOT, 'vite.config.js')).href);
    const beforeApiRequest = rateLimitPlugin.beforeApiRequest;
    expect(beforeApiRequest).toBeDefined();
    const req = { headers: {}, socket: { remoteAddress: `test-${Date.now()}` } };
    let statusCode;
    let body = '';
    const res = {
      statusCode: 0,
      set statusCode(v) { statusCode = v; },
      get statusCode() { return statusCode; },
      setHeader: () => {},
      end: (chunk) => { body = chunk ?? ''; },
    };
    const next = () => {};
    for (let i = 0; i < 10; i++) {
      statusCode = 0;
      body = '';
      beforeApiRequest({ req, res, path: '/api/health', next });
      expect(statusCode).toBe(0);
    }
    statusCode = 0;
    body = '';
    beforeApiRequest({ req, res, path: '/api/health', next });
    expect(statusCode).toBe(429);
    expect(JSON.parse(body).error).toBe('Too many requests');
  });
});
