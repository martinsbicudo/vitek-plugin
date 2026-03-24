import { createRequestHandler } from '../../core/server/request-handler.js';
import { createSocketHandler } from '../../core/socket/socket-handler.js';
import { SOCKET_BASE_PATH } from '../../shared/constants.js';
import type { VitekApp } from '../../core/shared/vitek-app.js';
import type { DevServerState } from './dev-server-state.js';
import type { ViteDevServerOptions } from './dev-server-state.js';

export function createApiMiddleware(
  state: DevServerState,
  options: ViteDevServerOptions,
  shared: VitekApp
) {
  return createRequestHandler({
    routes: state.routes,
    middlewares: state.middlewares,
    beforeApiRequest: options.beforeApiRequest,
    cors: options.cors,
    trustProxy: options.trustProxy,
    maxBodySize: options.maxBodySize,
    onError: options.onError,
    logger: options.logger,
    shared,
    production: options.production,
    observability: options.observability,
  });
}

export function createSocketSetup(
  state: DevServerState,
  options: ViteDevServerOptions,
  shared: VitekApp
) {
  return (httpServer: { on(event: 'upgrade', listener: (req: import('http').IncomingMessage, socket: import('stream').Duplex, head: Buffer) => void): void }) => {
    if (options.sockets !== false && state.sockets.length > 0) {
      const socketBasePath = options.socketBasePath ?? SOCKET_BASE_PATH;
      const handler = createSocketHandler({
        sockets: state.sockets,
        socketBasePath,
        shared,
        logger: options.logger,
      });
      httpServer.on('upgrade', handler);
    }
  };
}
