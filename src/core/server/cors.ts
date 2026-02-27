/**
 * CORS header helpers for the request handler
 */

import type { IncomingMessage } from 'http';

export interface CorsOptions {
  /** Allowed origin(s). Use '*' for any, or a specific origin. */
  origin?: string | string[];
  /** Allowed methods. Default: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS */
  methods?: string[];
  /** Allowed request headers. */
  allowedHeaders?: string[];
  /** Headers exposed to the browser. */
  exposeHeaders?: string[];
  /** Allow credentials (cookies, authorization). When true, origin cannot be '*'. */
  credentials?: boolean;
  /** Max age in seconds for preflight cache. */
  maxAge?: number;
}

const DEFAULT_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const DEFAULT_ALLOWED_HEADERS = ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'];

export interface NormalizedCorsOptions {
  origin: string | string[];
  methods: string[];
  allowedHeaders: string[];
  exposeHeaders: string[];
  credentials: boolean;
  maxAge: number | undefined;
}

export function normalizeCorsOptions(cors: boolean | CorsOptions): NormalizedCorsOptions {
  if (cors === true) {
    return {
      origin: '*',
      methods: DEFAULT_METHODS,
      allowedHeaders: DEFAULT_ALLOWED_HEADERS,
      exposeHeaders: [],
      credentials: false,
      maxAge: undefined,
    };
  }
  const opts = cors as CorsOptions;
  return {
    origin: opts.origin ?? '*',
    methods: opts.methods ?? DEFAULT_METHODS,
    allowedHeaders: opts.allowedHeaders ?? DEFAULT_ALLOWED_HEADERS,
    exposeHeaders: opts.exposeHeaders ?? [],
    credentials: opts.credentials ?? false,
    maxAge: opts.maxAge,
  };
}

function resolveOrigin(requestOrigin: string | undefined, option: string | string[]): string {
  if (option === '*') return '*';
  if (Array.isArray(option)) {
    if (requestOrigin && option.includes(requestOrigin)) return requestOrigin;
    return option[0] ?? '*';
  }
  return option;
}

export function getCorsHeaders(
  req: IncomingMessage,
  options: NormalizedCorsOptions
): Record<string, string> {
  const requestOrigin = req.headers.origin as string | undefined;
  const origin = resolveOrigin(requestOrigin, options.origin);

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': options.methods.join(', '),
    'Access-Control-Allow-Headers': options.allowedHeaders.join(', '),
  };
  if (options.exposeHeaders.length > 0) {
    headers['Access-Control-Expose-Headers'] = options.exposeHeaders.join(', ');
  }
  if (options.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  if (options.maxAge != null) {
    headers['Access-Control-Max-Age'] = String(options.maxAge);
  }
  return headers;
}
