/**
 * vitek:dev — configureServer, middleware, watcher
 */

import * as path from 'path';
import * as fs from 'fs';
import { createViteDevServerMiddleware } from '../adapters/vite/dev-server.js';
import { createViteLogger } from '../adapters/vite/logger.js';
import { API_BASE_PATH, getSocketBasePath } from '../shared/constants.js';
import type { Plugin } from 'vite';
import type { PluginContext } from './context.js';

export function createDevPlugin(ctx: PluginContext): Plugin {
  return {
    name: 'vitek:dev',

    async configureServer(server) {
      if (!ctx.root) return;
      const fullApiDir = path.resolve(ctx.root, ctx.apiDirOption);

      if (!fs.existsSync(fullApiDir)) {
        server.config.logger.warn(
          `[vitek] API directory not found: ${fullApiDir}`
        );
        return;
      }

      const logger = createViteLogger(server.config.logger, ctx.options.logging);
      const socketsEnabled = ctx.options.sockets !== false;
      const socketBasePath = getSocketBasePath(
        ctx.options.apiBasePath,
        typeof ctx.options.sockets === 'object' ? ctx.options.sockets?.path : undefined
      );
      const beforeApiRequest = (ctx.options.plugins ?? [])
        .filter((p): p is typeof p & { beforeApiRequest: NonNullable<typeof p.beforeApiRequest> } => !!p.beforeApiRequest)
        .map((p) => (hookCtx: { req: import('http').IncomingMessage; res: import('http').ServerResponse; path: string; method: string }, next: () => void) =>
          p.beforeApiRequest!({ ...hookCtx, next })
        );
      const afterTypesGenerated = (ctx.options.plugins ?? [])
        .map((p) => p.afterTypesGenerated)
        .filter((h): h is NonNullable<typeof h> => !!h);
      const { ready, middleware, cleanup, setupSockets } = createViteDevServerMiddleware({
        root: ctx.root,
        apiDir: fullApiDir,
        logger,
        viteServer: server,
        enableValidation: ctx.options.enableValidation || false,
        openApi: ctx.options.openApi,
        sockets: socketsEnabled,
        socketBasePath,
        apiBasePath: ctx.options.apiBasePath ?? API_BASE_PATH,
        onGenerationError: ctx.options.onGenerationError,
        beforeApiRequest,
        afterTypesGenerated,
        cors: ctx.options.cors,
        trustProxy: ctx.options.trustProxy,
        onError: ctx.options.onError,
      });

      ctx.cleanupFn = cleanup;

      server.middlewares.use(middleware);

      await ready;

      if (socketsEnabled && server.httpServer) {
        setupSockets(server.httpServer);
      }

      logger.info('Vitek plugin initialized');

      const port = server.config.server?.port ?? 5173;
      const apiPath = ctx.options.apiBasePath ?? API_BASE_PATH;
      const originalPrintUrls = server.printUrls?.bind(server);
      if (typeof originalPrintUrls === 'function') {
        server.printUrls = () => {
          originalPrintUrls();
          const host = 'localhost';
          const apiUrl = `http://${host}:${port}${apiPath}`;
          server.config.logger.info(`  ➜  API:     ${apiUrl}`);
          if (socketsEnabled) {
            const wsUrl = `ws://${host}:${port}${socketBasePath}`;
            server.config.logger.info(`  ➜  WS:      ${wsUrl}`);
          }
        };
      }
    },
  };
}
