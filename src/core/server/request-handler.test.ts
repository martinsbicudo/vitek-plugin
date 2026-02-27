import { describe, it, expect, vi } from 'vitest';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Connect } from 'vite';
import { createRequestHandler } from './request-handler.js';
import { createRoute } from '../routing/route-parser.js';
import type { ParsedRoute } from '../routing/route-parser.js';
import type { LoadedMiddleware } from '../middleware/get-applicable-middlewares.js';
import { API_BASE_PATH } from '../../shared/constants.js';
import { NotFoundError } from '../../shared/errors.js';

function createTestRoute(parsed: ParsedRoute, handler: (ctx: any) => any) {
  return createRoute(parsed, handler);
}

function mockRequest(
  overrides: Partial<{ url: string; method: string; headers: Record<string, string>; bodyChunks?: string[] }> = {}
): IncomingMessage {
  const url = overrides.url ?? `${API_BASE_PATH}/health`;
  const method = overrides.method ?? 'GET';
  const headers = overrides.headers ?? { host: 'localhost' };
  const bodyChunks = overrides.bodyChunks ?? [];
  const req = {
    url: url.includes('?') ? url : url,
    method,
    headers: { ...headers },
    on: vi.fn((event: string, cb: (chunk?: Buffer) => void) => {
      if (event === 'data' && bodyChunks.length) {
        for (const c of bodyChunks) {
          (cb as (chunk: Buffer) => void)(Buffer.from(c));
        }
      }
      if (event === 'end') (cb as () => void)();
      return req;
    }),
  } as unknown as IncomingMessage;
  return req;
}

type MockResponseOut = {
  _statusCode: number;
  _headers: Record<string, string>;
  _body: string;
  _ended: boolean;
  statusCode: number;
  writableEnded: boolean;
  setHeader(name: string, value: string | number | string[]): MockResponseOut;
  end(chunk?: string | (() => void), _encoding?: (() => void) | string, cb?: () => void): MockResponseOut;
  writeHead: ReturnType<typeof vi.fn>;
};

function mockResponse(): ServerResponse & { _statusCode: number; _headers: Record<string, string>; _body: string } {
  const out: MockResponseOut = {
    _statusCode: 0,
    _headers: {},
    _body: '',
    _ended: false,
    get statusCode() {
      return out._statusCode;
    },
    set statusCode(code: number) {
      out._statusCode = code;
    },
    get writableEnded() {
      return out._ended;
    },
    setHeader(name: string, value: string | number | string[]) {
      out._headers[name] = Array.isArray(value) ? value.join(', ') : String(value);
      return out;
    },
    end(chunk?: string | (() => void), _encoding?: (() => void) | string, cb?: () => void) {
      out._ended = true;
      if (typeof chunk === 'string') out._body = chunk;
      else if (typeof chunk === 'function') chunk();
      (cb as () => void)?.();
      return out;
    },
    writeHead: vi.fn(),
  };
  return out as unknown as ServerResponse & { _statusCode: number; _headers: Record<string, string>; _body: string };
}

function next(): Connect.NextFunction {
  return vi.fn();
}

describe('createRequestHandler', () => {
  it('calls next() when url is missing', async () => {
    const handler = createRequestHandler({ routes: [], middlewares: [] });
    const req = mockRequest() as IncomingMessage & { url?: string };
    delete req.url;
    const res = mockResponse();
    const nextFn = next();
    await handler(req, res, nextFn);
    expect(nextFn).toHaveBeenCalled();
  });

  it('calls next() when path is not under API_BASE_PATH', async () => {
    const handler = createRequestHandler({ routes: [], middlewares: [] });
    const req = mockRequest({ url: '/other' });
    const res = mockResponse();
    const nextFn = next();
    await handler(req, res, nextFn);
    expect(nextFn).toHaveBeenCalled();
  });

  it('returns 404 when no route matches', async () => {
    const handler = createRequestHandler({ routes: [], middlewares: [] });
    const req = mockRequest({ url: `${API_BASE_PATH}/nonexistent` });
    const res = mockResponse();
    const nextFn = next();
    await handler(req, res, nextFn);
    expect(nextFn).not.toHaveBeenCalled();
    expect(res._statusCode).toBe(404);
    expect(res._headers['Content-Type'] ?? res._headers['content-type']).toContain('json');
    expect(JSON.parse(res._body)).toEqual({ error: 'Route not found' });
  });

  it('returns 200 with JSON body when handler returns plain object', async () => {
    const route = createTestRoute(
      { method: 'get', pattern: 'health', params: [], file: '/api/health.get.ts' },
      () => ({ ok: true })
    );
    const handler = createRequestHandler({ routes: [route], middlewares: [] });
    const req = mockRequest({ url: `${API_BASE_PATH}/health` });
    const res = mockResponse();
    await handler(req, res, next());
    expect(res._statusCode).toBe(200);
    expect(JSON.parse(res._body)).toEqual({ ok: true });
  });

  it('uses VitekResponse status and headers when handler returns them', async () => {
    const route = createTestRoute(
      { method: 'get', pattern: 'health', params: [], file: '/api/health.get.ts' },
      () => ({ status: 201, headers: { 'X-Custom': 'yes' }, body: { id: 1 } })
    );
    const handler = createRequestHandler({ routes: [route], middlewares: [] });
    const req = mockRequest({ url: `${API_BASE_PATH}/health` });
    const res = mockResponse();
    await handler(req, res, next());
    expect(res._statusCode).toBe(201);
    expect(res._headers['X-Custom']).toBe('yes');
    expect(JSON.parse(res._body)).toEqual({ id: 1 });
  });

  it('ends response with no body when VitekResponse body is undefined', async () => {
    const route = createTestRoute(
      { method: 'get', pattern: 'health', params: [], file: '/api/health.get.ts' },
      () => ({ status: 204 })
    );
    const handler = createRequestHandler({ routes: [route], middlewares: [] });
    const req = mockRequest({ url: `${API_BASE_PATH}/health` });
    const res = mockResponse();
    await handler(req, res, next());
    expect(res._statusCode).toBe(204);
    expect(res._body).toBe('');
  });

  it('passes params and query to handler via context', async () => {
    let capturedContext: any;
    const route = createTestRoute(
      { method: 'get', pattern: 'users/:id', params: ['id'], file: '/api/users/[id].get.ts' },
      (ctx) => {
        capturedContext = ctx;
        return { id: ctx.params.id, page: ctx.query.page };
      }
    );
    const handler = createRequestHandler({ routes: [route], middlewares: [] });
    const req = mockRequest({ url: `${API_BASE_PATH}/users/42?page=2` });
    const res = mockResponse();
    await handler(req, res, next());
    expect(capturedContext.params).toEqual({ id: '42' });
    expect(capturedContext.query).toEqual({ page: '2' });
    expect(res._statusCode).toBe(200);
    expect(JSON.parse(res._body)).toEqual({ id: '42', page: '2' });
  });

  it('sets context.sockets when shared.sockets is provided', async () => {
    const emit = vi.fn();
    const sockets = { emit };
    let capturedContext: any;
    const route = createTestRoute(
      { method: 'get', pattern: 'health', params: [], file: '/api/health.get.ts' },
      (ctx) => {
        capturedContext = ctx;
        return {};
      }
    );
    const handler = createRequestHandler({
      routes: [route],
      middlewares: [],
      shared: { sockets },
    });
    const req = mockRequest({ url: `${API_BASE_PATH}/health` });
    await handler(req, mockResponse(), next());
    expect(capturedContext.sockets).toBe(sockets);
  });

  it('runs applicable middlewares before handler', async () => {
    const order: string[] = [];
    const middleware: LoadedMiddleware = {
      basePattern: '',
      middleware: [
        async (_ctx, next) => {
          order.push('mw1');
          await next();
        },
        async (_ctx, next) => {
          order.push('mw2');
          await next();
        },
      ],
    };
    const route = createTestRoute(
      { method: 'get', pattern: 'health', params: [], file: '/api/health.get.ts' },
      () => {
        order.push('handler');
        return {};
      }
    );
    const handler = createRequestHandler({ routes: [route], middlewares: [middleware] });
    const req = mockRequest({ url: `${API_BASE_PATH}/health` });
    await handler(req, mockResponse(), next());
    expect(order).toEqual(['mw1', 'mw2', 'handler']);
  });

  it('returns HTTP error status when handler throws HttpError', async () => {
    const route = createTestRoute(
      { method: 'get', pattern: 'health', params: [], file: '/api/health.get.ts' },
      () => {
        throw new NotFoundError('Not found');
      }
    );
    const handler = createRequestHandler({ routes: [route], middlewares: [] });
    const req = mockRequest({ url: `${API_BASE_PATH}/health` });
    const res = mockResponse();
    await handler(req, res, next());
    expect(res._statusCode).toBe(404);
    const body = JSON.parse(res._body);
    expect(body.error).toBeDefined();
    expect(body.message).toContain('Not found');
  });

  it('parses JSON body for POST and passes to handler', async () => {
    let capturedBody: unknown;
    const route = createTestRoute(
      { method: 'post', pattern: 'items', params: [], file: '/api/items.post.ts' },
      (ctx) => {
        capturedBody = ctx.body;
        return { received: ctx.body };
      }
    );
    const handler = createRequestHandler({ routes: [route], middlewares: [] });
    const req = mockRequest({
      method: 'POST',
      url: `${API_BASE_PATH}/items`,
      bodyChunks: [JSON.stringify({ name: 'test' })],
    });
    const res = mockResponse();
    await handler(req, res, next());
    expect(capturedBody).toEqual({ name: 'test' });
    expect(res._statusCode).toBe(200);
    expect(JSON.parse(res._body)).toEqual({ received: { name: 'test' } });
  });

  it('sends string body as-is when VitekResponse body is string', async () => {
    const route = createTestRoute(
      { method: 'get', pattern: 'health', params: [], file: '/api/health.get.ts' },
      () => ({ status: 200, body: '<html>ok</html>' })
    );
    const handler = createRequestHandler({ routes: [route], middlewares: [] });
    const req = mockRequest({ url: `${API_BASE_PATH}/health` });
    const res = mockResponse();
    await handler(req, res, next());
    expect(res._body).toBe('<html>ok</html>');
  });

  it('sends Cache-Control and other custom headers when present in VitekResponse', async () => {
    const route = createTestRoute(
      { method: 'get', pattern: 'health', params: [], file: '/api/health.get.ts' },
      () => ({
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=60' },
        body: { cached: true },
      })
    );
    const handler = createRequestHandler({ routes: [route], middlewares: [] });
    const req = mockRequest({ url: `${API_BASE_PATH}/health` });
    const res = mockResponse();
    await handler(req, res, next());
    expect(res._statusCode).toBe(200);
    expect(res._headers['Cache-Control']).toBe('max-age=60');
    expect(JSON.parse(res._body)).toEqual({ cached: true });
  });

  it('returns 500 when handler throws generic error', async () => {
    const route = createTestRoute(
      { method: 'get', pattern: 'health', params: [], file: '/api/health.get.ts' },
      () => {
        throw new Error('Something broke');
      }
    );
    const handler = createRequestHandler({ routes: [route], middlewares: [] });
    const req = mockRequest({ url: `${API_BASE_PATH}/health` });
    const res = mockResponse();
    await handler(req, res, next());
    expect(res._statusCode).toBe(500);
    const body = JSON.parse(res._body);
    expect(body.error).toBe('Internal server error');
    expect(body.message).toContain('Something broke');
  });

  it('when onError is set and sends response, uses that status and body', async () => {
    const route = createTestRoute(
      { method: 'get', pattern: 'health', params: [], file: '/api/health.get.ts' },
      () => {
        throw new Error('Unavailable');
      }
    );
    const handler = createRequestHandler({
      routes: [route],
      middlewares: [],
      onError: (_err, _req, res) => {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Service Unavailable' }));
      },
    });
    const req = mockRequest({ url: `${API_BASE_PATH}/health` });
    const res = mockResponse();
    await handler(req, res, next());
    expect(res._statusCode).toBe(503);
    expect(JSON.parse(res._body)).toEqual({ error: 'Service Unavailable' });
  });

  it('when onError is set but does not end response, default 500 is sent', async () => {
    const route = createTestRoute(
      { method: 'get', pattern: 'health', params: [], file: '/api/health.get.ts' },
      () => {
        throw new Error('Oops');
      }
    );
    const handler = createRequestHandler({
      routes: [route],
      middlewares: [],
      onError: () => {
        // does not call res.end()
      },
    });
    const req = mockRequest({ url: `${API_BASE_PATH}/health` });
    const res = mockResponse();
    await handler(req, res, next());
    expect(res._statusCode).toBe(500);
    expect(JSON.parse(res._body).error).toBe('Internal server error');
  });

  describe('CORS', () => {
    it('with cors: true, OPTIONS request returns 204 and CORS headers', async () => {
      const handler = createRequestHandler({ routes: [], middlewares: [], cors: true });
      const req = mockRequest({ method: 'OPTIONS', url: `${API_BASE_PATH}/health` });
      const res = mockResponse();
      const nextFn = next();
      await handler(req, res, nextFn);
      expect(nextFn).not.toHaveBeenCalled();
      expect(res._statusCode).toBe(204);
      expect(res._headers['Access-Control-Allow-Origin']).toBe('*');
      expect(res._body).toBe('');
    });

    it('with cors: true, GET request returns 200 with CORS headers', async () => {
      const route = createTestRoute(
        { method: 'get', pattern: 'health', params: [], file: '/api/health.get.ts' },
        () => ({ ok: true })
      );
      const handler = createRequestHandler({ routes: [route], middlewares: [], cors: true });
      const req = mockRequest({ url: `${API_BASE_PATH}/health` });
      const res = mockResponse();
      await handler(req, res, next());
      expect(res._statusCode).toBe(200);
      expect(res._headers['Access-Control-Allow-Origin']).toBe('*');
      expect(JSON.parse(res._body)).toEqual({ ok: true });
    });

    it('with cors: { origin: "https://example.com" }, allows that origin', async () => {
      const route = createTestRoute(
        { method: 'get', pattern: 'health', params: [], file: '/api/health.get.ts' },
        () => ({ ok: true })
      );
      const handler = createRequestHandler({
        routes: [route],
        middlewares: [],
        cors: { origin: 'https://example.com' },
      });
      const req = mockRequest({
        url: `${API_BASE_PATH}/health`,
        headers: { host: 'localhost', origin: 'https://example.com' },
      });
      const res = mockResponse();
      await handler(req, res, next());
      expect(res._statusCode).toBe(200);
      expect(res._headers['Access-Control-Allow-Origin']).toBe('https://example.com');
    });
  });

  describe('global middleware with pathPatterns', () => {
    it('applies global middleware with pathPatterns; when middleware does not call next(), handler is not run', async () => {
      let handlerRan = false;
      const route = createTestRoute(
        { method: 'get', pattern: 'protected/me', params: [], file: '/api/protected/me.get.ts' },
        () => {
          handlerRan = true;
          return { user: 'me' };
        }
      );
      const authMiddleware: LoadedMiddleware = {
        basePattern: '',
        pathPatterns: ['protected/*'],
        middleware: [
          async (_ctx, _next) => {
            // short-circuit: do not call next()
          },
        ],
      };
      const handler = createRequestHandler({
        routes: [route],
        middlewares: [authMiddleware],
      });
      const req = mockRequest({ url: `${API_BASE_PATH}/protected/me` });
      const res = mockResponse();
      await handler(req, res, next());
      expect(handlerRan).toBe(false);
    });
    it('does not apply global middleware with pathPatterns to non-matching route', async () => {
      const route = createTestRoute(
        { method: 'get', pattern: 'health', params: [], file: '/api/health.get.ts' },
        () => ({ ok: true })
      );
      const authMiddleware: LoadedMiddleware = {
        basePattern: '',
        pathPatterns: ['protected/*'],
        middleware: [async (_ctx, next) => next()],
      };
      const handler = createRequestHandler({
        routes: [route],
        middlewares: [authMiddleware],
      });
      const req = mockRequest({ url: `${API_BASE_PATH}/health` });
      const res = mockResponse();
      await handler(req, res, next());
      expect(res._statusCode).toBe(200);
      expect(JSON.parse(res._body)).toEqual({ ok: true });
    });
  });

  describe('proxy (trustProxy)', () => {
    it('with trustProxy: true, sets context.url and context.clientIp from X-Forwarded-*', async () => {
      let capturedContext: any;
      const route = createTestRoute(
        { method: 'get', pattern: 'health', params: [], file: '/api/health.get.ts' },
        (ctx) => {
          capturedContext = ctx;
          return { url: ctx.url, clientIp: ctx.clientIp };
        }
      );
      const handler = createRequestHandler({ routes: [route], middlewares: [], trustProxy: true });
      const req = mockRequest({
        url: `${API_BASE_PATH}/health`,
        headers: {
          host: 'localhost',
          'x-forwarded-proto': 'https',
          'x-forwarded-host': 'api.example.com',
          'x-forwarded-for': '1.2.3.4',
        },
      });
      const res = mockResponse();
      await handler(req, res, next());
      expect(res._statusCode).toBe(200);
      const body = JSON.parse(res._body);
      expect(body.url).toMatch(/^https:\/\/api\.example\.com\/api\/health/);
      expect(body.clientIp).toBe('1.2.3.4');
      expect(capturedContext.clientIp).toBe('1.2.3.4');
    });
  });
});
