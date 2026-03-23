/**
 * Logger adapter for Vite
 * Translates core events into Vite logs
 */

import type { Logger } from 'vite';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggingOptions {
  level?: LogLevel;
  enableRequestLogging?: boolean;
  enableRouteLogging?: boolean;
  production?: boolean;
}

const RESET = '\x1b[0m';

/**
 * Formats the [vitek] tag with green color and bold
 * Uses ANSI codes: \x1b[1m = bold, \x1b[32m = green, \x1b[0m = reset
 */
function formatTag(text: string): string {
  return `\x1b[1m\x1b[32m${text}${RESET}`;
}

/** ANSI color for HTTP method in Registered routes (method only) */
function methodColor(method: string): string {
  const m = method.toUpperCase();
  switch (m) {
    case 'GET': return '\x1b[32m';    // green
    case 'POST': return '\x1b[33m';    // yellow
    case 'PUT': return '\x1b[34m';     // blue
    case 'PATCH': return '\x1b[36m';   // cyan
    case 'DELETE': return '\x1b[31m';  // red
    case 'HEAD':
    case 'OPTIONS': return '\x1b[90m'; // gray
    default: return '\x1b[0m';
  }
}

/** ANSI color for "WS" in Registered sockets */
const WS_COLOR = '\x1b[95m'; // bright magenta (pink)

const PAYLOAD_PREVIEW_MAX = 80;

function payloadPreview(data: unknown): string {
  if (data === undefined || data === null) return '';
  if (typeof data === 'string') return data.length <= PAYLOAD_PREVIEW_MAX ? data : data.slice(0, PAYLOAD_PREVIEW_MAX) + '…';
  if (Buffer.isBuffer(data)) return `<Buffer ${data.length} bytes>`;
  try {
    const s = JSON.stringify(data);
    return s.length <= PAYLOAD_PREVIEW_MAX ? s : s.slice(0, PAYLOAD_PREVIEW_MAX) + '…';
  } catch {
    return String(data).slice(0, PAYLOAD_PREVIEW_MAX);
  }
}

/**
 * Checks if a log level should be logged based on the configured level
 */
function shouldLog(level: LogLevel, configuredLevel: LogLevel): boolean {
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const levelIndex = levels.indexOf(level);
  const configuredIndex = levels.indexOf(configuredLevel);
  return levelIndex >= configuredIndex;
}

export interface VitekLogger {
  debug(message: string, data?: Record<string, any>): void;
  info(message: string, data?: Record<string, any>): void;
  warn(message: string, data?: Record<string, any>): void;
  error(message: string, data?: Record<string, any>): void;
  routesRegistered(routes: Array<{ method: string; pattern: string }>, apiBasePath: string): void;
  socketsRegistered(sockets: Array<{ pattern: string }>, socketBasePath: string): void;
  routeMatched(pattern: string, method: string): void;
  middlewareLoaded(count: number): void;
  typesGenerated(outputPath: string): void;
  servicesGenerated(outputPath: string): void;
  /** Log when a request is received (endpoint called). Only when enableRequestLogging. */
  requestStart(method: string, path: string): void;
  request(method: string, path: string, statusCode: number, duration?: number): void;
  response(method: string, path: string, statusCode: number, duration?: number): void;
  /** Socket events (only logged when enableRequestLogging is true) */
  socketConnected(path: string, pattern?: string): void;
  socketDisconnected(path: string, pattern?: string): void;
  socketMessageReceived(path: string, pattern?: string, data?: unknown): void;
  socketMessageEmitted(path: string, data?: unknown): void;
  getOptions(): LoggingOptions;
}

/**
 * Creates a logger that uses Vite's logger
 */
export function createViteLogger(viteLogger: Logger, options?: LoggingOptions): VitekLogger {
  const tag = formatTag('[vitek]');
  let logLevel: LogLevel = options?.level || 'info';
  if (options?.production && logLevel === 'debug') {
    logLevel = 'info';
  }
  const enableRequestLogging = options?.enableRequestLogging || false;
  const enableRouteLogging = options?.enableRouteLogging !== false;
  
  const formatData = (data?: Record<string, any>): string => {
    if (!data || Object.keys(data).length === 0) {
      return '';
    }
    return ' ' + JSON.stringify(data);
  };
  
  return {
    debug(message: string, data?: Record<string, any>) {
      if (shouldLog('debug', logLevel)) {
        viteLogger.info(`${tag} [DEBUG] ${message}${formatData(data)}`, { timestamp: true });
      }
    },
    
    info(message: string, data?: Record<string, any>) {
      if (shouldLog('info', logLevel)) {
        viteLogger.info(`${tag} ${message}${formatData(data)}`, { timestamp: true });
      }
    },
    
    warn(message: string, data?: Record<string, any>) {
      if (shouldLog('warn', logLevel)) {
        viteLogger.warn(`${tag} ${message}${formatData(data)}`, { timestamp: true });
      }
    },
    
    error(message: string, data?: Record<string, any>) {
      if (shouldLog('error', logLevel)) {
        viteLogger.error(`${tag} ${message}${formatData(data)}`, { timestamp: true });
      }
    },
    
    routesRegistered(routes: Array<{ method: string; pattern: string }>, apiBasePath: string) {
      if (routes.length === 0) {
        if (shouldLog('info', logLevel)) {
          viteLogger.info(`${tag} No routes registered`, { timestamp: true });
        }
        return;
      }
      
      if (shouldLog('info', logLevel)) {
        const routesList = routes
          .map(r => {
            const pattern = r.pattern === '' ? '/' : `/${r.pattern}`;
            const method = r.method.toUpperCase();
            return `  ${methodColor(r.method)}${method}${RESET} ${apiBasePath}${pattern}`;
          })
          .join('\n');
        
        viteLogger.info(
          `${tag} Registered routes:\n${routesList}`,
          { timestamp: true }
        );
      }
    },

    socketsRegistered(sockets: Array<{ pattern: string }>, socketBasePath: string) {
      if (sockets.length === 0) {
        if (shouldLog('info', logLevel)) {
          viteLogger.info(`${tag} No sockets registered`, { timestamp: true });
        }
        return;
      }

      if (shouldLog('info', logLevel)) {
        const socketsList = sockets
          .map(s => {
            const pathSegment = s.pattern === '' ? '' : `/${s.pattern}`;
            return `  ${WS_COLOR}WS${RESET} ${socketBasePath}${pathSegment}`;
          })
          .join('\n');

        viteLogger.info(
          `${tag} Registered sockets:\n${socketsList}`,
          { timestamp: true }
        );
      }
    },
    
    routeMatched(pattern: string, method: string) {
      if (enableRouteLogging && shouldLog('debug', logLevel)) {
        viteLogger.info(
          `${tag} [ROUTE] ${method.toUpperCase()} ${pattern}`,
          { timestamp: true }
        );
      }
    },
    
    middlewareLoaded(count: number) {
      if (shouldLog('info', logLevel)) {
        viteLogger.info(
          `${tag} Loaded ${count} global middleware(s)`,
          { timestamp: true }
        );
      }
    },
    
    typesGenerated(outputPath: string) {
      if (shouldLog('info', logLevel)) {
        viteLogger.info(
          `${tag} Generated types: ${outputPath}`,
          { timestamp: true }
        );
      }
    },
    
    servicesGenerated(outputPath: string) {
      if (shouldLog('info', logLevel)) {
        viteLogger.info(
          `${tag} Generated services: ${outputPath}`,
          { timestamp: true }
        );
      }
    },
    
    requestStart(method: string, path: string) {
      if (enableRequestLogging && shouldLog('info', logLevel)) {
        const m = method.toUpperCase();
        viteLogger.info(
          `${tag} ${methodColor(method)}[${m}]${RESET} ${path} →`,
          { timestamp: true }
        );
      }
    },

    request(method: string, path: string, statusCode: number, duration?: number) {
      if (enableRequestLogging && shouldLog('info', logLevel)) {
        const durationStr = duration !== undefined ? ` (${duration}ms)` : '';
        const statusColor = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
        const m = method.toUpperCase();
        viteLogger.info(
          `${tag} ${methodColor(method)}[${m}]${RESET} ${path} ${statusColor}${statusCode}${RESET}${durationStr}`,
          { timestamp: true }
        );
      }
    },
    
    response(method: string, path: string, statusCode: number, duration?: number) {
      // Alias for request (for consistency)
      this.request(method, path, statusCode, duration);
    },

    socketConnected(path: string, pattern?: string) {
      if (enableRequestLogging && shouldLog('info', logLevel)) {
        viteLogger.info(`${tag} ${WS_COLOR}[WS]${RESET} connected ${path}`, { timestamp: true });
      }
    },

    socketDisconnected(path: string, pattern?: string) {
      if (enableRequestLogging && shouldLog('info', logLevel)) {
        viteLogger.info(`${tag} ${WS_COLOR}[WS]${RESET} disconnected ${path}`, { timestamp: true });
      }
    },

    socketMessageReceived(path: string, pattern?: string, data?: unknown) {
      if (enableRequestLogging && shouldLog('info', logLevel)) {
        const preview = payloadPreview(data);
        const suffix = preview ? ` ${preview}` : '';
        viteLogger.info(`${tag} ${WS_COLOR}[WS]${RESET} received ${path}${suffix}`, { timestamp: true });
      }
    },

    socketMessageEmitted(path: string, data?: unknown) {
      if (enableRequestLogging && shouldLog('info', logLevel)) {
        const preview = payloadPreview(data);
        const suffix = preview ? ` ${preview}` : '';
        viteLogger.info(`${tag} ${WS_COLOR}[WS]${RESET} emitted ${path}${suffix}`, { timestamp: true });
      }
    },

    getOptions(): LoggingOptions {
      return {
        level: logLevel,
        enableRequestLogging,
        enableRouteLogging,
        production: options?.production,
      };
    },
  };
}

