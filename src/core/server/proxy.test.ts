import { describe, it, expect } from 'vitest';
import type { IncomingMessage } from 'http';
import { getEffectiveRequest } from './proxy.js';

function mockReq(overrides: Partial<{ url: string; headers: Record<string, string>; socket?: { remoteAddress?: string } }> = {}): IncomingMessage {
  return {
    url: overrides.url ?? '/api/health',
    headers: overrides.headers ?? {},
    socket: overrides.socket,
  } as IncomingMessage;
}

describe('getEffectiveRequest', () => {
  it('returns req.url as-is when trustProxy is false', () => {
    const req = mockReq({ url: '/api/health?foo=bar' });
    const result = getEffectiveRequest(req, false);
    expect(result.url).toBe('/api/health?foo=bar');
    expect(result.clientIp).toBeUndefined();
  });

  it('returns req.url when trustProxy is true but no X-Forwarded-* headers', () => {
    const req = mockReq({ url: '/api/health', headers: { host: 'localhost' } });
    const result = getEffectiveRequest(req, true);
    expect(result.url).toMatch(/^http:\/\/localhost\/api\/health/);
    expect(result.clientIp).toBeUndefined();
  });

  it('builds effective URL from X-Forwarded-* when trustProxy is true', () => {
    const req = mockReq({
      url: '/api/users/1',
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'api.example.com',
        'x-forwarded-for': '1.2.3.4',
      },
    });
    const result = getEffectiveRequest(req, true);
    expect(result.url).toBe('https://api.example.com/api/users/1');
    expect(result.clientIp).toBe('1.2.3.4');
  });

  it('uses first value when X-Forwarded-For has multiple entries', () => {
    const req = mockReq({
      url: '/api/health',
      headers: { 'x-forwarded-for': '  client, proxy1, proxy2  ' },
    });
    const result = getEffectiveRequest(req, true);
    expect(result.clientIp).toBe('client');
  });

  it('falls back to socket.remoteAddress for clientIp when no X-Forwarded-For', () => {
    const req = mockReq({
      url: '/api/health',
      headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'api.example.com' },
      socket: { remoteAddress: '192.168.1.1' },
    });
    const result = getEffectiveRequest(req, true);
    expect(result.clientIp).toBe('192.168.1.1');
  });
});
