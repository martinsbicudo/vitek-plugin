/**
 * Main Vite plugin
 * Thin layer that registers the plugin and connects with adapters
 */

import type { Plugin } from 'vite';
import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';
import { createViteDevServerMiddleware } from './adapters/vite/dev-server.js';
import { createViteLogger } from './adapters/vite/logger.js';
import { createRequestHandler } from './core/server/request-handler.js';
import { buildApiBundle, getApiBundleFilename } from './build/build-api-bundle.js';
import { API_BASE_PATH, API_DIR_NAME } from './shared/constants.js';
import type { RequestHandlerOptions } from './core/server/request-handler.js';

export interface VitekOptions {
  /** API directory (relative to root) */
  apiDir?: string;
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
}

/**
 * Vite plugin for Vitek
 */
export function vitek(options: VitekOptions = {}): Plugin {
  const apiDirOption = options.apiDir || `src/${API_DIR_NAME}`;
  const buildApi = options.buildApi !== false;
  let root: string;
  let buildOutDir: string;
  let cleanupFn: (() => void) | null = null;

  return {
    name: 'vitek',

    configResolved(config) {
      root = config.root;
      buildOutDir = path.resolve(root, config.build?.outDir ?? 'dist');
    },
    
    configureServer(server) {
      const fullApiDir = path.resolve(root, apiDirOption);

      if (!fs.existsSync(fullApiDir)) {
        server.config.logger.warn(
          `[vitek] API directory not found: ${fullApiDir}`
        );
        return;
      }

      const logger = createViteLogger(server.config.logger, options.logging);
      const { middleware, cleanup } = createViteDevServerMiddleware({
        root,
        apiDir: fullApiDir,
        logger,
        viteServer: server,
        enableValidation: options.enableValidation || false,
      });
      
      cleanupFn = cleanup;

      server.middlewares.use(middleware);

      logger.info('Vitek plugin initialized');
      const relativeApiDir = path.relative(root, fullApiDir);
      logger.info(`API directory: ./${relativeApiDir.replace(/\\/g, '/')}`);
    },

    configurePreviewServer(server) {
      if (!buildApi) {
        return;
      }
      const bundlePath = path.join(buildOutDir, getApiBundleFilename());
      if (!fs.existsSync(bundlePath)) {
        server.config.logger.warn(
          '[vitek] API bundle not found; preview serving static assets only. Run `vite build` first.'
        );
        return;
      }
      const bundleUrl = pathToFileURL(bundlePath).href;
      const bundleLoadPromise = import(bundleUrl) as Promise<{
        routes: RequestHandlerOptions['routes'];
        middlewares: RequestHandlerOptions['middlewares'];
      }>;

      let apiHandler: ReturnType<typeof createRequestHandler> | null = null;

      const apiMiddleware = (req: import('http').IncomingMessage, res: import('http').ServerResponse, next: () => void) => {
        if (!req.url?.startsWith(API_BASE_PATH)) {
          return next();
        }
        bundleLoadPromise
          .then((mod) => {
            if (!apiHandler) {
              apiHandler = createRequestHandler({
                routes: mod.routes,
                middlewares: mod.middlewares,
              });
              server.config.logger.info('[vitek] API middleware registered for preview');
            }
            apiHandler(req, res, next);
          })
          .catch((err) => {
            server.config.logger.error(
              `[vitek] Failed to load API bundle: ${err instanceof Error ? err.message : String(err)}`
            );
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', message: 'Failed to load API bundle' }));
          });
      };

      server.middlewares.use(apiMiddleware);
    },

    async closeBundle() {
      if (buildApi) {
        const fullApiDir = path.resolve(root, apiDirOption);
        try {
          await buildApiBundle({
            root,
            apiDir: fullApiDir,
            outDir: buildOutDir,
          });
        } catch (err) {
          console.error('[vitek] Failed to build API bundle:', err instanceof Error ? err.message : err);
        }
      }
    },

    buildEnd() {
      if (cleanupFn) {
        cleanupFn();
        cleanupFn = null;
      }
    },
  };
}

