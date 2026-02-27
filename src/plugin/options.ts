import type { OpenApiOptions } from '../core/openapi/generate.js';

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
}
