/**
 * Main Vite plugin
 * Thin layer that registers the plugin and connects with adapters
 */

import type { Plugin } from 'vite';
import * as path from 'path';
import * as fs from 'fs';
import { createViteDevServerMiddleware } from './adapters/vite/dev-server.js';
import { createViteLogger } from './adapters/vite/logger.js';
import { API_DIR_NAME } from './shared/constants.js';

export interface VitekOptions {
  /** API directory (relative to root) */
  apiDir?: string;
  /** API base path (default: /api) */
  apiBasePath?: string;
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
}

/**
 * Vite plugin for Vitek
 */
export function vitek(options: VitekOptions = {}): Plugin {
  const apiDir = options.apiDir || `src/${API_DIR_NAME}`;
  let root: string;
  let cleanupFn: (() => void) | null = null;
  
  return {
    name: 'vitek',
    
    configResolved(config) {
      root = config.root;
    },
    
    configureServer(server) {
      const fullApiDir = path.resolve(root, apiDir);
      
      // Check if directory exists
      if (!fs.existsSync(fullApiDir)) {
        server.config.logger.warn(
          `[vitek] API directory not found: ${fullApiDir}`
        );
        return;
      }
      
      // Create logger and middleware
      const logger = createViteLogger(server.config.logger, options.logging);
      const { middleware, cleanup } = createViteDevServerMiddleware({
        root,
        apiDir: fullApiDir,
        logger,
        viteServer: server,
        enableValidation: options.enableValidation || false,
      });
      
      cleanupFn = cleanup;
      
      // Register middleware in Vite server
      server.middlewares.use(middleware);
      
      logger.info('Vitek plugin initialized');
      // Show relative path to root
      const relativeApiDir = path.relative(root, fullApiDir);
      logger.info(`API directory: ./${relativeApiDir.replace(/\\/g, '/')}`);
    },
    
    buildEnd() {
      // Clean up resources when build ends
      if (cleanupFn) {
        cleanupFn();
        cleanupFn = null;
      }
    },
  };
}

