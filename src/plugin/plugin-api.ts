/**
 * Plugin API for extending Vitek
 * External plugins can register hooks via vitek({ plugins: [...] })
 */

import type { IncomingMessage, ServerResponse } from 'http';
import type { RouteSchema } from '../core/types/schema.js';
import type { ParsedSocket } from '../core/routing/socket-parser.js';

/**
 * Context passed to afterTypesGenerated hook
 */
export interface AfterTypesGeneratedContext {
  /** Project root directory */
  root: string;
  /** Route schema (pattern, method, params, file, bodyType, queryType) */
  schema: RouteSchema[];
  /** Parsed socket definitions */
  sockets: ParsedSocket[];
  /** API base path (e.g. /api) */
  apiBasePath: string;
  /** WebSocket base path (e.g. /api/ws) */
  socketBasePath: string;
}

/**
 * Context passed to beforeApiRequest hook
 */
export interface BeforeApiRequestContext {
  /** Incoming HTTP request */
  req: IncomingMessage;
  /** Response object (use to short-circuit and send custom response) */
  res: ServerResponse;
  /** Path relative to API base (e.g. /health, /users/123) */
  path: string;
  /** HTTP method (lowercase) */
  method: string;
  /** Call to continue to the route handler. Do not call if you send a response. */
  next: () => void;
}

/**
 * A Vitek plugin extends the core with custom hooks
 */
export interface VitekPlugin {
  /** Plugin name (for debugging) */
  name?: string;
  /** Called after types, services, and optionally OpenAPI are generated */
  afterTypesGenerated?: (ctx: AfterTypesGeneratedContext) => void | Promise<void>;
  /** Called before each API request. Call next() to continue, or send response and skip next() to short-circuit */
  beforeApiRequest?: (ctx: BeforeApiRequestContext) => void | Promise<void>;
}
