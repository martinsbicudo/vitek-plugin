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
import { buildSocketsBundle, getSocketsBundleFilename } from './build/build-sockets-bundle.js';
import { createSocketHandler } from './core/socket/socket-handler.js';
import { API_BASE_PATH, API_DIR_NAME, SOCKET_BASE_PATH } from './shared/constants.js';
import type { RequestHandlerOptions } from './core/server/request-handler.js';
import type { OpenApiOptions } from './core/openapi/generate.js';

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
  /** Enable OpenAPI/Swagger documentation generation */
  openApi?: OpenApiOptions | boolean;
  /** Enable WebSocket sockets (default: true). Set to false to disable, or { path: '/ws' } to customize base path. */
  sockets?: boolean | { path?: string };
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
      const socketsEnabled = options.sockets !== false;
      const { middleware, cleanup, setupSockets } = createViteDevServerMiddleware({
        root,
        apiDir: fullApiDir,
        logger,
        viteServer: server,
        enableValidation: options.enableValidation || false,
        openApi: options.openApi,
        sockets: socketsEnabled,
      });

      cleanupFn = cleanup;

      server.middlewares.use(middleware);

      if (socketsEnabled && server.httpServer) {
        setupSockets(server.httpServer);
      }

      logger.info('Vitek plugin initialized');
      const relativeApiDir = path.relative(root, fullApiDir);
      logger.info(`API directory: ./${relativeApiDir.replace(/\\/g, '/')}`);
    },

    async configurePreviewServer(server) {
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
        const pathname = req.url?.split('?')[0] ?? '';
        if (pathname !== API_BASE_PATH && !pathname.startsWith(API_BASE_PATH + '/')) {
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

      const socketsEnabled = options.sockets !== false;
      const socketBasePath = typeof options.sockets === 'object' && options.sockets?.path
        ? options.sockets.path
        : SOCKET_BASE_PATH;
      const socketsBundlePath = path.join(buildOutDir, getSocketsBundleFilename());
      if (socketsEnabled && fs.existsSync(socketsBundlePath)) {
        try {
          const socketsUrl = pathToFileURL(socketsBundlePath).href;
          const mod = await import(socketsUrl) as { sockets: Parameters<typeof createSocketHandler>[0]['sockets'] };
          const handler = createSocketHandler({
            sockets: mod.sockets,
            socketBasePath,
          });
          server.httpServer?.on('upgrade', handler);
          server.config.logger.info('[vitek] WebSocket sockets registered for preview');
        } catch (err) {
          server.config.logger.warn(
            `[vitek] Failed to load sockets bundle: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
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
        const socketsEnabled = options.sockets !== false;
        if (socketsEnabled && fs.existsSync(fullApiDir)) {
          try {
            await buildSocketsBundle({
              root,
              apiDir: fullApiDir,
              outDir: buildOutDir,
            });
          } catch (err) {
            console.error('[vitek] Failed to build sockets bundle:', err instanceof Error ? err.message : err);
          }
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

