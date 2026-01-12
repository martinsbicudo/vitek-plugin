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
}

/**
 * Formats the [vitek] tag with green color and bold
 * Uses ANSI codes: \x1b[1m = bold, \x1b[32m = green, \x1b[0m = reset
 */
function formatTag(text: string): string {
  return `\x1b[1m\x1b[32m${text}\x1b[0m`;
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
  routeMatched(pattern: string, method: string): void;
  middlewareLoaded(count: number): void;
  typesGenerated(outputPath: string): void;
  servicesGenerated(outputPath: string): void;
  request(method: string, path: string, statusCode: number, duration?: number): void;
  response(method: string, path: string, statusCode: number, duration?: number): void;
  getOptions(): LoggingOptions;
}

/**
 * Creates a logger that uses Vite's logger
 */
export function createViteLogger(viteLogger: Logger, options?: LoggingOptions): VitekLogger {
  const tag = formatTag('[vitek]');
  const logLevel: LogLevel = options?.level || 'info';
  const enableRequestLogging = options?.enableRequestLogging || false;
  const enableRouteLogging = options?.enableRouteLogging !== false; // Default true
  
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
            return `  ${r.method.toUpperCase()} ${apiBasePath}${pattern}`;
          })
          .join('\n');
        
        viteLogger.info(
          `${tag} Registered routes:\n${routesList}`,
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
    
    request(method: string, path: string, statusCode: number, duration?: number) {
      if (enableRequestLogging && shouldLog('info', logLevel)) {
        const durationStr = duration !== undefined ? ` (${duration}ms)` : '';
        const statusColor = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
        viteLogger.info(
          `${tag} [REQUEST] ${method.toUpperCase()} ${path} ${statusColor}${statusCode}\x1b[0m${durationStr}`,
          { timestamp: true }
        );
      }
    },
    
    response(method: string, path: string, statusCode: number, duration?: number) {
      // Alias for request (for consistency)
      this.request(method, path, statusCode, duration);
    },
    
    getOptions(): LoggingOptions {
      return {
        level: logLevel,
        enableRequestLogging,
        enableRouteLogging,
      };
    },
  };
}

