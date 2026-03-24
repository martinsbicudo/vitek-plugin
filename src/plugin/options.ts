import type { OpenApiOptions } from '../core/openapi/generate.js';
import type { IssueDispatcher } from '../core/dispatch/types.js';
import type { VitekPlugin } from './plugin-api.js';
import type { CorsOptions } from '../core/server/cors.js';

export type { CorsOptions };

export interface VitekOptions {
  /** API directory (relative to root) */
  apiDir?: string;
  /** Source directory for transform (default: 'src') */
  srcDir?: string;
  /** API base path (default: /api) */
  apiBasePath?: string;
  /** Build API bundle for preview/production (default: true). Set to false to skip. */
  buildApi?: boolean;
  /** Enable request validation (default: false) */
  enableValidation?: boolean;
  /** Logging configuration */
  logging?: {
    /** Log level: 'debug' | 'info' | 'warn' | 'error' (default: 'info') */
    level?: 'debug' | 'info' | 'warn' | 'error';
    /** Enable request/response logging (default: false) */
    enableRequestLogging?: boolean;
    /** Enable route matching logs (default: true) */
    enableRouteLogging?: boolean;
  };
  /** Enable OpenAPI/Swagger documentation generation */
  openApi?: OpenApiOptions | boolean;
  /** Enable WebSocket sockets (default: true). Set to false to disable, or { path: '/ws' } to customize base path. */
  sockets?: boolean | { path?: string };
  /** Callback when types/services/OpenAPI generation fails. Receives the error. */
  onGenerationError?: (error: Error) => void;
  /** External plugins for extensibility. See [Plugin API](/guide/plugin-api). */
  plugins?: VitekPlugin[];
  /** Resolve aliases merged into Vite's resolve.alias (e.g. { '@lib': 'src/lib' }). See [Alias](/guide/alias). */
  alias?: Record<string, string>;
  /** Enable CORS. `true` for defaults, or [CorsOptions](/guide/configuration#cors). */
  cors?: boolean | CorsOptions;
  /** When true, trust X-Forwarded-* headers (use behind reverse proxy). Sets context.clientIp and effective url. */
  trustProxy?: boolean;
  /** Max request body size in bytes. When exceeded, responds with 413 Payload Too Large. Omit for no limit. */
  maxBodySize?: number;
  /** Custom error handler when a non-HttpError is thrown. Can send a custom response; if res is not ended, default 500 JSON is sent. */
  onError?: (err: Error, req: import('http').IncomingMessage, res: import('http').ServerResponse) => void | Promise<void>;
  /** When `features.issueDispatch` is true in `vitek.platform.json`, replaces the default console/webhook dispatcher. */
  issueDispatcher?: IssueDispatcher;
}
