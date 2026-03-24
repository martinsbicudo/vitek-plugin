import { describe, it, expect, vi } from 'vitest';
import {
  createMockContext,
  createMockReq,
  createMockRes,
  runMiddlewareChain,
} from '../testing/testing.js';
import type { Middleware } from '../core/routing/route-types.js';

describe('createMockContext', () => {
  it('applies defaults', () => {
    const ctx = createMockContext();
    expect(ctx.method).toBe('get');
    expect(ctx.query).toEqual({});
    expect(ctx.params).toEqual({});
    expect(ctx.headers).toEqual({});
    expect(ctx.url).toContain('/api/health');
    expect(ctx.path).toBe('/api/health');
  });

  it('merges overrides', () => {
    const ctx = createMockContext({
      method: 'post',
      params: { id: '7' },
      query: { q: 'a' },
      headers: { authorization: 'Bearer x' },
      body: { x: 1 },
      clientIp: '127.0.0.1',
    });
    expect(ctx.method).toBe('post');
    expect(ctx.params).toEqual({ id: '7' });
    expect(ctx.query).toEqual({ q: 'a' });
    expect(ctx.headers).toEqual({ authorization: 'Bearer x' });
    expect(ctx.body).toEqual({ x: 1 });
    expect(ctx.clientIp).toBe('127.0.0.1');
  });

  it('merges requestId override', () => {
    const ctx = createMockContext({ requestId: 'rid-9' });
    expect(ctx.requestId).toBe('rid-9');
  });

  it('uses custom path when url omitted', () => {
    const ctx = createMockContext({ path: '/api/users' });
    expect(ctx.path).toBe('/api/users');
  });
});

describe('createMockReq', () => {
  it('applies defaults', () => {
    const req = createMockReq();
    expect(req.method).toBe('GET');
    expect(req.headers).toEqual({});
    expect(req.url).toContain('health');
  });

  it('merges overrides', () => {
    const req = createMockReq({
      method: 'DELETE',
      headers: { 'x-test': '1' },
      body: null,
    });
    expect(req.method).toBe('DELETE');
    expect(req.headers).toEqual({ 'x-test': '1' });
    expect(req.body).toBeNull();
  });
});

describe('createMockRes', () => {
  it('captures status and headers', () => {
    const res = createMockRes();
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    expect(res.statusCode).toBe(404);
    expect(res.getHeader('content-type')).toBe('application/json');
  });

  it('captures end body', () => {
    const res = createMockRes();
    res.end('ok');
    expect(Buffer.concat(res.bodyChunks).toString()).toBe('ok');
  });

  it('captures buffer end', () => {
    const res = createMockRes();
    res.end(Buffer.from([1, 2]));
    expect(res.bodyChunks[0].equals(Buffer.from([1, 2]))).toBe(true);
  });
});

describe('runMiddlewareChain', () => {
  it('runs middlewares in order then completes', async () => {
    const order: string[] = [];
    const m1: Middleware = async (_ctx, next) => {
      order.push('a');
      await next();
      order.push('b');
    };
    const m2: Middleware = async (_ctx, next) => {
      order.push('c');
      await next();
    };
    await runMiddlewareChain(createMockContext(), [m1, m2]);
    expect(order).toEqual(['a', 'c', 'b']);
  });

  it('short-circuits when next is not called', async () => {
    const after = vi.fn();
    const m1: Middleware = async () => {};
    const m2: Middleware = async (_ctx, next) => {
      await next();
      after();
    };
    await runMiddlewareChain(createMockContext(), [m1, m2]);
    expect(after).not.toHaveBeenCalled();
  });

  it('propagates middleware errors', async () => {
    const m: Middleware = async () => {
      throw new Error('fail');
    };
    await expect(runMiddlewareChain(createMockContext(), [m])).rejects.toThrow('fail');
  });
});
