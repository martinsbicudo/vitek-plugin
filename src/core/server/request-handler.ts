/**
 * Shared request handler for API routes
 * Used by both dev server and preview/production server
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { Connect } from 'vite';
import { matchRoute } from '../routing/route-matcher.js';
import { createContext, isVitekResponse, type VitekResponse } from '../context/create-context.js';
import { getApplicableMiddlewares } from '../middleware/get-applicable-middlewares.js';
import { compose } from '../middleware/compose.js';
import { API_BASE_PATH } from '../../shared/constants.js';
import { HttpError } from '../../shared/errors.js';
import type { Route } from '../routing/route-types.js';
import type { LoadedMiddleware } from '../middleware/get-applicable-middlewares.js';
import type { SocketEmitter } from '../shared/vitek-app.js';
import {
  normalizeCorsOptions,
  getCorsHeaders,
  type NormalizedCorsOptions,
} from './cors.js';
import { getEffectiveRequest } from './proxy.js';

/** Callback for beforeApiRequest hook. Call next() to continue, or send response and return without next() to short-circuit. */
export type BeforeApiRequestHook = (
  ctx: { req: IncomingMessage; res: ServerResponse; path: string; method: string },
  next: () => void
) => void | Promise<void>;

export interface RequestHandlerOptions {
  routes: Route[];
  middlewares: LoadedMiddleware[];
  /** Hooks called before each API request. Call next() to continue. */
  beforeApiRequest?: BeforeApiRequestHook[];
  /** Enable CORS. true or CorsOptions. When set, OPTIONS preflight and CORS headers on responses are handled. */
  cors?: boolean | import('./cors.js').CorsOptions;
  /** When true, trust X-Forwarded-* headers and set context.clientIp / effective url. */
  trustProxy?: boolean;
  logger?: {
    routeMatched?(pattern: string, method: string): void;
    requestStart?(method: string, path: string): void;
    request?(method: string, path: string, statusCode: number, duration?: number): void;
    warn?(message: string, data?: Record<string, unknown>): void;
    error?(message: string, data?: Record<string, unknown>): void;
  };
  /** When provided, context.sockets is set so route handlers can emit to WebSocket clients. */
  shared?: { sockets: SocketEmitter };
  /** Max request body size in bytes. When exceeded, responds with 413 Payload Too Large. Omit for no limit. */
  maxBodySize?: number;
  /** Called when a non-HttpError is thrown. May send a custom response; if res is not ended, default 500 JSON is sent. */
  onError?: (err: Error, req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
}

const noop = () => {};

/** True if value is a Node.js Readable stream (has .pipe). Used for streaming response body. */
function isReadableStream(value: unknown): value is NodeJS.ReadableStream {
  return (
    value != null &&
    typeof value === 'object' &&
    typeof (value as NodeJS.ReadableStream).pipe === 'function'
  );
}

/**
 * Creates a Connect-style middleware that handles /api/* requests using the given routes and middlewares.
 */
function applyCorsHeaders(res: ServerResponse, corsHeaders: Record<string, string>): void {
  for (const [key, value] of Object.entries(corsHeaders)) {
    res.setHeader(key, value);
  }
}

export function createRequestHandler(options: RequestHandlerOptions): (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => Promise<void> {
  const { routes, middlewares, beforeApiRequest = [], cors, trustProxy = false, logger, shared, maxBodySize, onError } = options;
  const corsOpts: NormalizedCorsOptions | null = cors != null ? normalizeCorsOptions(cors) : null;
  const logRouteMatched = logger?.routeMatched ?? noop;
  const logRequestStart = logger?.requestStart ?? noop;
  const logRequest = logger?.request ?? noop;
  const logWarn = logger?.warn ?? noop;
  const logError = logger?.error ?? noop;

  return async (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
    if (!req.url) return next();
    const pathname = req.url.split('?')[0];
    if (pathname !== API_BASE_PATH && !pathname.startsWith(API_BASE_PATH + '/')) {
      return next();
    }

    const startTime = Date.now();
    const requestMethod = req.method?.toLowerCase() || 'get';
    const requestPath = pathname;

    const effective = getEffectiveRequest(req, trustProxy);
    const requestUrl = effective.url || req.url;

    if (corsOpts) {
      const corsHeaders = getCorsHeaders(req, corsOpts);
      applyCorsHeaders(res, corsHeaders);
      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }
    }

    try {
      const url = new URL(requestUrl, 'http://localhost');
      const routePath = url.pathname.replace(API_BASE_PATH, '') || '/';
      const method = requestMethod;

      const doHandleRequest = async () => {
      const match = matchRoute(routes, routePath, method);

      if (!match) {
        const duration = Date.now() - startTime;
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        if (corsOpts) applyCorsHeaders(res, getCorsHeaders(req, corsOpts));
        res.end(JSON.stringify({ error: 'Route not found' }));
        logRequest(requestMethod, requestPath, 404, duration);
        return;
      }

      logRouteMatched(match.route.pattern, method);
      logRequestStart(requestMethod, requestPath);

      const query: Record<string, string | string[]> = {};
      url.searchParams.forEach((value, key) => {
        if (query[key]) {
          const existing = query[key];
          query[key] = Array.isArray(existing) ? [...existing, value] : [existing as string, value];
        } else {
          query[key] = value;
        }
      });

      const PAYLOAD_TOO_LARGE_SENTINEL = Symbol('PAYLOAD_TOO_LARGE');
      let body: unknown;
      if (['post', 'put', 'patch'].includes(method)) {
        body = await new Promise<unknown>((resolve, reject) => {
          const chunks: Buffer[] = [];
          let totalSize = 0;
          const onData = (chunk: Buffer) => {
            if (maxBodySize != null) {
              totalSize += chunk.length;
              if (totalSize > maxBodySize) {
                req.removeListener('data', onData);
                req.removeListener('end', onEnd);
                req.destroy();
                reject(new Error('PAYLOAD_TOO_LARGE'));
                return;
              }
            }
            chunks.push(chunk);
          };
          const onEnd = () => {
            const rawBody = Buffer.concat(chunks).toString();
            if (!rawBody) {
              resolve(undefined);
              return;
            }
            try {
              resolve(JSON.parse(rawBody));
            } catch {
              resolve(rawBody);
            }
          };
          req.on('data', onData);
          req.on('end', onEnd);
        }).catch((err) => {
          if (err?.message === 'PAYLOAD_TOO_LARGE') {
            const duration = Date.now() - startTime;
            res.statusCode = 413;
            res.setHeader('Content-Type', 'application/json');
            if (corsOpts) applyCorsHeaders(res, getCorsHeaders(req, corsOpts));
            res.end(JSON.stringify({ error: 'Payload Too Large' }));
            logRequest(requestMethod, requestPath, 413, duration);
            return PAYLOAD_TOO_LARGE_SENTINEL;
          }
          throw err;
        });
        if (body === PAYLOAD_TOO_LARGE_SENTINEL) return;
      }

      const context = createContext(
        {
          url: requestUrl,
          method,
          headers: (req.headers || {}) as Record<string, string>,
          body,
        },
        match.params,
        query
      );
      if (effective.clientIp) context.clientIp = effective.clientIp;
      if (shared?.sockets) {
        context.sockets = shared.sockets;
      }

      const applicableMiddlewares = getApplicableMiddlewares(middlewares, match.route.pattern);
      const composed = compose(applicableMiddlewares);
      const handler = async () => {
        const result = await match.route.handler(context);

        if (isVitekResponse(result)) {
          const response = result as VitekResponse;
          const statusCode = response.status || 200;
          if (corsOpts) applyCorsHeaders(res, getCorsHeaders(req, corsOpts));
          if (response.headers) {
            for (const [key, value] of Object.entries(response.headers)) {
              res.setHeader(key, value);
            }
          }
          if (!response.headers || !response.headers['Content-Type']) {
            if (response.body !== undefined && !isReadableStream(response.body)) {
              res.setHeader('Content-Type', 'application/json');
            }
          }
          res.statusCode = statusCode;
          if (response.body === undefined) {
            res.end();
            logRequest(requestMethod, requestPath, statusCode, Date.now() - startTime);
          } else if (isReadableStream(response.body)) {
            const stream = response.body as NodeJS.ReadableStream;
            res.once('finish', () =>
              logRequest(requestMethod, requestPath, statusCode, Date.now() - startTime)
            );
            stream.pipe(res as NodeJS.WritableStream);
          } else if (typeof response.body === 'string') {
            res.end(response.body);
            logRequest(requestMethod, requestPath, statusCode, Date.now() - startTime);
          } else {
            res.end(JSON.stringify(response.body));
            logRequest(requestMethod, requestPath, statusCode, Date.now() - startTime);
          }
        } else {
          if (corsOpts) applyCorsHeaders(res, getCorsHeaders(req, corsOpts));
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify(result));
          logRequest(requestMethod, requestPath, 200, Date.now() - startTime);
        }
      };

      await composed(context, handler);
      };

      if (beforeApiRequest.length > 0) {
        for (const hook of beforeApiRequest) {
          await new Promise<void>((resolve, reject) => {
            let done = false;
            const next = () => { if (!done) { done = true; resolve(); } };
            Promise.resolve(hook({ req, res, path: routePath, method }, next))
              .then(() => { if (!done && res.writableEnded) { done = true; resolve(); } })
              .catch(reject);
          });
          if (res.writableEnded) return;
        }
      }
      await doHandleRequest();
    } catch (error) {
      const duration = Date.now() - startTime;

      if (corsOpts) applyCorsHeaders(res, getCorsHeaders(req, corsOpts));
      if (error instanceof HttpError) {
        const httpError = error as HttpError;
        logWarn(`HTTP Error ${httpError.statusCode}: ${httpError.message}`);
        res.statusCode = httpError.statusCode;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: httpError.name,
            message: httpError.message,
            code: httpError.code,
          })
        );
        logRequest(requestMethod, requestPath, httpError.statusCode, duration);
      } else {
        const err = error instanceof Error ? error : new Error(String(error));
        if (onError) {
          await Promise.resolve(onError(err, req, res));
          if (res.writableEnded) {
            logRequest(requestMethod, requestPath, res.statusCode, duration);
            return;
          }
        }
        const errorMessage = err.message;
        logError(`Error handling request: ${errorMessage}`);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'Internal server error',
            message: errorMessage,
          })
        );
        logRequest(requestMethod, requestPath, 500, duration);
      }
    }
  };
}
