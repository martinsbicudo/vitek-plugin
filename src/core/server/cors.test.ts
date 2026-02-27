import { describe, it, expect } from 'vitest';
import type { IncomingMessage } from 'http';
import { normalizeCorsOptions, getCorsHeaders } from './cors.js';

describe('normalizeCorsOptions', () => {
  it('returns permissive defaults when cors is true', () => {
    const opts = normalizeCorsOptions(true);
    expect(opts.origin).toBe('*');
    expect(opts.methods).toContain('GET');
    expect(opts.methods).toContain('POST');
    expect(opts.methods).toContain('OPTIONS');
    expect(opts.allowedHeaders.length).toBeGreaterThan(0);
    expect(opts.credentials).toBe(false);
  });

  it('merges partial CorsOptions with defaults', () => {
    const opts = normalizeCorsOptions({ origin: 'https://app.example.com' });
    expect(opts.origin).toBe('https://app.example.com');
    expect(opts.methods).toContain('GET');
    expect(opts.credentials).toBe(false);
  });

  it('allows custom methods and maxAge', () => {
    const opts = normalizeCorsOptions({
      methods: ['GET', 'POST'],
      maxAge: 3600,
    });
    expect(opts.methods).toEqual(['GET', 'POST']);
    expect(opts.maxAge).toBe(3600);
  });
});

describe('getCorsHeaders', () => {
  function mockReq(origin?: string): IncomingMessage {
    return { headers: origin ? { origin } : {} } as IncomingMessage;
  }

  it('returns Allow-Origin * when option is *', () => {
    const opts = normalizeCorsOptions(true);
    const headers = getCorsHeaders(mockReq(), opts);
    expect(headers['Access-Control-Allow-Origin']).toBe('*');
    expect(headers['Access-Control-Allow-Methods']).toBeDefined();
    expect(headers['Access-Control-Allow-Headers']).toBeDefined();
  });

  it('returns request origin when it matches allowed origin', () => {
    const opts = normalizeCorsOptions({ origin: 'https://app.example.com' });
    const headers = getCorsHeaders(mockReq('https://app.example.com'), opts);
    expect(headers['Access-Control-Allow-Origin']).toBe('https://app.example.com');
  });

  it('includes maxAge when set', () => {
    const opts = normalizeCorsOptions({ maxAge: 600 });
    const headers = getCorsHeaders(mockReq(), opts);
    expect(headers['Access-Control-Max-Age']).toBe('600');
  });
});
