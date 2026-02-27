/**
 * vitek:preview — configurePreviewServer, bundle loading
 */

import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';
import { createRequestHandler } from '../core/server/request-handler.js';
import { createSocketHandler } from '../core/socket/socket-handler.js';
import { getApiBundleFilename } from '../build/build-api-bundle.js';
import { getSocketsBundleFilename } from '../build/build-sockets-bundle.js';
import { API_BASE_PATH, getSocketBasePath } from '../shared/constants.js';
import type { Plugin } from 'vite';
import type { ApiClient, SocketEmitter, VitekApp } from '../core/shared/vitek-app.js';
import type { RequestHandlerOptions } from '../core/server/request-handler.js';
import type { PluginContext } from './context.js';

export function createPreviewPlugin(ctx: PluginContext): Plugin {
  return {
    name: 'vitek:preview',

    async configurePreviewServer(server) {
      if (!ctx.buildApi || !ctx.root || !ctx.buildOutDir) return;
      const bundlePath = path.join(ctx.buildOutDir, getApiBundleFilename());
      if (!fs.existsSync(bundlePath)) {
        server.config.logger.warn(
          '[vitek] API bundle not found; preview serving static assets only. Run `vite build` first.'
        );
        return;
      }

      const previewPort = server.config.preview?.port ?? 4173;
      const apiBaseUrl = `http://127.0.0.1:${previewPort}${API_BASE_PATH}`;
      const api: ApiClient = {
        async fetch(path: string, fetchOptions?: { method?: string; body?: unknown }) {
          const url = `${apiBaseUrl}/${path.replace(/^\//, '')}`;
          const res = await fetch(url, {
            method: fetchOptions?.method ?? 'GET',
            headers:
              fetchOptions?.body !== undefined
                ? { 'Content-Type': 'application/json' }
                : undefined,
            body:
              fetchOptions?.body !== undefined
                ? JSON.stringify(fetchOptions.body)
                : undefined,
          });
          const text = await res.text();
          if (!text) return undefined;
          try {
            return JSON.parse(text);
          } catch {
            return text;
          }
        },
      };
      const noopSockets: SocketEmitter = { emit() {} };
      const shared: VitekApp = { sockets: noopSockets, api };

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
              const beforeApiRequest = (ctx.options.plugins ?? [])
              .filter((p): p is typeof p & { beforeApiRequest: NonNullable<typeof p.beforeApiRequest> } => !!p.beforeApiRequest)
              .map((p) => (hookCtx: { req: import('http').IncomingMessage; res: import('http').ServerResponse; path: string; method: string }, next: () => void) =>
                p.beforeApiRequest!({ ...hookCtx, next })
              );
            apiHandler = createRequestHandler({
                routes: mod.routes,
                middlewares: mod.middlewares,
                beforeApiRequest,
                cors: ctx.options.cors,
                trustProxy: ctx.options.trustProxy,
                maxBodySize: ctx.options.maxBodySize,
                onError: ctx.options.onError,
                shared,
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

      const socketsEnabled = ctx.options.sockets !== false;
      const socketBasePath = getSocketBasePath(
        ctx.options.apiBasePath,
        typeof ctx.options.sockets === 'object' ? ctx.options.sockets?.path : undefined
      );
      const socketsBundlePath = path.join(ctx.buildOutDir, getSocketsBundleFilename());
      if (socketsEnabled && fs.existsSync(socketsBundlePath)) {
        try {
          const socketsUrl = pathToFileURL(socketsBundlePath).href;
          const mod = await import(socketsUrl) as { sockets: Parameters<typeof createSocketHandler>[0]['sockets'] };
          const handler = createSocketHandler({
            sockets: mod.sockets,
            socketBasePath,
            shared,
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
  };
}
