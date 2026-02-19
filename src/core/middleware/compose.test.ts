import { describe, it, expect, vi } from 'vitest';
import { compose } from './compose.js';
import type { VitekContext } from '../context/create-context.js';
import type { Middleware } from '../routing/route-types.js';

function createMockContext(): VitekContext {
  return {
    url: '/test',
    method: 'get',
    path: '/test',
    query: {},
    params: {},
    headers: {},
  };
}

describe('compose', () => {
  it('should execute middleware in order', async () => {
    const order: string[] = [];
    
    const middleware1: Middleware = async (_ctx, next) => {
      order.push('middleware1-before');
      await next();
      order.push('middleware1-after');
    };

    const middleware2: Middleware = async (_ctx, next) => {
      order.push('middleware2-before');
      await next();
      order.push('middleware2-after');
    };

    const handler = async () => {
      order.push('handler');
    };

    const composed = compose([middleware1, middleware2]);
    await composed(createMockContext(), handler);

    expect(order).toEqual([
      'middleware1-before',
      'middleware2-before',
      'handler',
      'middleware2-after',
      'middleware1-after',
    ]);
  });

  it('should execute handler when no middlewares', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);

    const composed = compose([]);
    await composed(createMockContext(), handler);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should pass context to all middlewares', async () => {
    const context = createMockContext();
    const middleware1 = vi.fn().mockImplementation((_ctx, next) => next());
    const middleware2 = vi.fn().mockImplementation((_ctx, next) => next());
    const handler = vi.fn().mockResolvedValue(undefined);

    const composed = compose([middleware1, middleware2]);
    await composed(context, handler);

    expect(middleware1).toHaveBeenCalledWith(context, expect.any(Function));
    expect(middleware2).toHaveBeenCalledWith(context, expect.any(Function));
  });

  it('should allow middleware to modify context', async () => {
    const context = createMockContext();
    
    const middleware: Middleware = async (ctx, next) => {
      (ctx as any).customProperty = 'modified';
      await next();
    };

    const handler = vi.fn().mockImplementation(() => {
      expect((context as any).customProperty).toBe('modified');
    });

    const composed = compose([middleware]);
    await composed(context, handler);

    expect(handler).toHaveBeenCalled();
  });

  it('should handle async middlewares', async () => {
    const order: string[] = [];

    const middleware: Middleware = async (_ctx, next) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      order.push('middleware');
      await next();
    };

    const handler = async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      order.push('handler');
    };

    const composed = compose([middleware]);
    await composed(createMockContext(), handler);

    expect(order).toEqual(['middleware', 'handler']);
  });

  it('should handle errors in middleware', async () => {
    const error = new Error('Middleware error');
    const middleware: Middleware = async () => {
      throw error;
    };

    const composed = compose([middleware]);

    await expect(composed(createMockContext(), vi.fn())).rejects.toThrow('Middleware error');
  });

  it('should handle errors in handler', async () => {
    const error = new Error('Handler error');
    const middleware: Middleware = async (_ctx, next) => {
      await next();
    };

    const composed = compose([middleware]);

    await expect(
      composed(createMockContext(), () => Promise.reject(error))
    ).rejects.toThrow('Handler error');
  });

  it('should throw when next() is called multiple times', async () => {
    const badMiddleware: Middleware = async (_ctx, next) => {
      await next();
      await next(); // Should throw
    };

    const composed = compose([badMiddleware]);

    await expect(composed(createMockContext(), vi.fn())).rejects.toThrow('next() called multiple times');
  });

  it('should short-circuit when middleware does not call next', async () => {
    const order: string[] = [];

    const middleware1: Middleware = async (_ctx, _next) => {
      order.push('middleware1');
      // Does not call next
    };

    const middleware2: Middleware = async (_ctx, next) => {
      order.push('middleware2');
      await next();
    };

    const handler = vi.fn().mockResolvedValue(undefined);

    const composed = compose([middleware1, middleware2]);
    await composed(createMockContext(), handler);

    expect(order).toEqual(['middleware1']);
    expect(handler).not.toHaveBeenCalled();
  });

  it('should support multiple middlewares with different patterns', async () => {
    const results: string[] = [];

    const authMiddleware: Middleware = async (ctx, next) => {
      results.push('auth-check');
      (ctx as any).user = { id: '123' };
      await next();
    };

    const loggingMiddleware: Middleware = async (ctx, next) => {
      results.push('log-start');
      await next();
      results.push('log-end');
    };

    const validationMiddleware: Middleware = async (ctx, next) => {
      results.push('validate');
      await next();
    };

    const handler = async () => {
      results.push('handler');
    };

    const composed = compose([authMiddleware, loggingMiddleware, validationMiddleware]);
    await composed(createMockContext(), handler);

    expect(results).toEqual([
      'auth-check',
      'log-start',
      'validate',
      'handler',
      'log-end',
    ]);
  });

  it('should allow middleware to catch errors from downstream', async () => {
    const error = new Error('Downstream error');
    const caughtError: Error[] = [];

    const errorHandler: Middleware = async (_ctx, next) => {
      try {
        await next();
      } catch (err) {
        caughtError.push(err as Error);
      }
    };

    const composed = compose([errorHandler]);
    await composed(createMockContext(), () => Promise.reject(error));

    expect(caughtError).toHaveLength(1);
    expect(caughtError[0].message).toBe('Downstream error');
  });

  it('should execute handler exactly once', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);

    const middleware: Middleware = async (_ctx, next) => {
      await next();
    };

    const composed = compose([middleware, middleware, middleware]);
    await composed(createMockContext(), handler);

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
