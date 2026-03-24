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
  req: IncomingMessage;
  res: ServerResponse;
  path: string;
  method: string;
  next: () => void;
  requestId?: string;
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
