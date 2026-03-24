/**
 * vitek:dev — configureServer, middleware, watcher
 */

import * as path from 'path';
import * as fs from 'fs';
import { createViteDevServerMiddleware } from '../adapters/vite/dev-server.js';
import { createViteLogger } from '../adapters/vite/logger.js';
import { API_BASE_PATH, getSocketBasePath } from '../shared/constants.js';
import { isProduction } from '../shared/utils.js';
import type { Plugin } from 'vite';
import type { PluginContext } from './context.js';
import { loadPlatformConfig, isFeatureEnabled } from '../platform/config.js';
import { createConsoleIssueDispatcher } from '../core/dispatch/index.js';
import { createHttpWebhookIssueDispatcher } from '../adapters/dispatch/http-webhook.js';

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

      const production = isProduction({ mode: ctx.viteMode });
      const platformConfig = loadPlatformConfig(ctx.root);
      const observability = isFeatureEnabled(platformConfig, 'observability');
      const logger = createViteLogger(server.config.logger, {
        ...ctx.options.logging,
        production,
        ...(observability ? { observabilityStructuredLogs: true } : {}),
      });
      const issueDispatch = isFeatureEnabled(platformConfig, 'issueDispatch');
      const issueWebhookUrl = process.env.VITEK_ISSUE_WEBHOOK_URL;
      const issueWebhookAuth = process.env.VITEK_ISSUE_WEBHOOK_AUTH;
      const issueWebhookRetries = Number(process.env.VITEK_ISSUE_WEBHOOK_RETRIES ?? 2);
      const issueWebhookBackoffMs = Number(process.env.VITEK_ISSUE_WEBHOOK_BACKOFF_MS ?? 150);
      const issueDispatcher = issueDispatch
        ? issueWebhookUrl
          ? createHttpWebhookIssueDispatcher({
              url: issueWebhookUrl,
              ...(issueWebhookAuth ? { headers: { Authorization: issueWebhookAuth } } : {}),
              retries: Number.isFinite(issueWebhookRetries) ? issueWebhookRetries : 2,
              backoffMs: Number.isFinite(issueWebhookBackoffMs) ? issueWebhookBackoffMs : 150,
              onDeadLetter: (event, error) =>
                logger.error('Issue webhook dispatch dead-letter', { eventId: event.id, error: error.message }),
            })
          : createConsoleIssueDispatcher()
        : undefined;
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
        maxBodySize: ctx.options.maxBodySize,
        onError: ctx.options.onError,
        production,
        observability,
        ...(issueDispatcher ? { issueDispatcher } : {}),
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
