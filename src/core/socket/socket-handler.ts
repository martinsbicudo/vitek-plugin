/**
 * WebSocket upgrade handler for socket routes
 * Uses ws package for WebSocket handshake
 */

import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import type { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import { SOCKET_BASE_PATH } from '../../shared/constants.js';
import type { ApiClient, SocketEmitter, VitekApp } from '../shared/vitek-app.js';

export interface SocketEntry {
  pattern: string;
  params: string[];
  file: string;
  regex: RegExp;
  handler: (ctx: VitekSocketContext) => void | (() => void);
}

export interface VitekSocketContext {
  socket: WebSocket;
  req: IncomingMessage;
  params: Record<string, string>;
  path: string;
  /** Present when the app is run with shared context (dev, preview, production with vitek-serve). Use to call the REST API internally. */
  api?: ApiClient;
}

/** Optional logger for socket events (connect, disconnect, message received/emitted). Uses same config as request logging. */
export interface SocketLogger {
  socketConnected(path: string, pattern?: string): void;
  socketDisconnected(path: string, pattern?: string): void;
  socketMessageReceived(path: string, pattern?: string, data?: unknown): void;
  socketMessageEmitted(path: string, data?: unknown): void;
}

export interface CreateSocketHandlerOptions {
  sockets: SocketEntry[];
  socketBasePath?: string;
  /** When provided, the handler populates shared.sockets (emit) and passes shared.api into the user handler as ctx.api. */
  shared?: VitekApp;
  /** When provided and app has request logging enabled, logs connect/disconnect/received/emitted. */
  logger?: SocketLogger;
}

/**
 * Extracts pathname from request URL (without query string)
 */
function getPathname(req: IncomingMessage): string {
  const url = req.url ?? '/';
  const q = url.indexOf('?');
  return q >= 0 ? url.slice(0, q) : url;
}

/**
 * Matches a path against socket routes and returns the matched socket with extracted params
 */
function matchSocket(
  sockets: SocketEntry[],
  pathname: string
): { socket: SocketEntry; params: Record<string, string> } | null {
  for (const socket of sockets) {
    const match = pathname.match(socket.regex);
    if (match) {
      const params: Record<string, string> = {};
      socket.params.forEach((name, i) => {
        params[name] = match[i + 1] ?? '';
      });
      return { socket, params };
    }
  }
  return null;
}

/** WebSocket OPEN state for safe send */
const WS_OPEN = 1;

/**
 * Creates an HTTP upgrade handler for WebSocket connections.
 * Registers with server.on('upgrade', handler).
 * Does not intercept /__vite (Vite HMR) or paths outside socketBasePath.
 * When options.shared is provided, populates shared.sockets (emit) and passes shared.api into the user handler as ctx.api.
 */
function fullSocketPath(basePath: string, pattern: string): string {
  return pattern === '' ? basePath : `${basePath}/${pattern}`;
}

export function createSocketHandler(options: CreateSocketHandlerOptions): (req: IncomingMessage, socket: Duplex, head: Buffer) => void {
  const { sockets, socketBasePath = SOCKET_BASE_PATH, shared, logger } = options;

  if (sockets.length === 0) {
    return () => {};
  }

  const registry = new Map<string, Set<WebSocket>>();

  const emitter: SocketEmitter = {
    emit(path: string, data: string | Buffer | object) {
      logger?.socketMessageEmitted(fullSocketPath(socketBasePath, path), data);
      const set = registry.get(path);
      if (!set) return;
      const payload =
        typeof data === 'object' && data !== null && !Buffer.isBuffer(data)
          ? JSON.stringify(data)
          : (data as string | Buffer);
      for (const ws of set) {
        if (ws.readyState === WS_OPEN) ws.send(payload);
      }
    },
  };

  if (shared) {
    shared.sockets = emitter;
  }

  const wss = new WebSocketServer({ noServer: true });

  return (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const pathname = getPathname(req);

    if (pathname.startsWith('/__vite')) {
      return;
    }
    if (!pathname.startsWith(socketBasePath)) {
      return;
    }

    const subPath = pathname.slice(socketBasePath.length) || '/';
    const matched = matchSocket(sockets, subPath);

    if (!matched) {
      socket.destroy();
      return;
    }

    const { socket: socketEntry, params } = matched;
    const pattern = socketEntry.pattern;

    wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
      let set = registry.get(pattern);
      if (!set) {
        set = new Set();
        registry.set(pattern, set);
      }
      set.add(ws);

      logger?.socketConnected(pathname, pattern);

      ws.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
        logger?.socketMessageReceived(pathname, pattern, data);
      });

      const removeFromRegistry = () => {
        const s = registry.get(pattern);
        if (s) {
          s.delete(ws);
          if (s.size === 0) registry.delete(pattern);
        }
      };

      const cleanup = socketEntry.handler({
        socket: ws,
        req,
        params,
        path: pathname,
        api: shared?.api,
      });

      const onClose = () => {
        logger?.socketDisconnected(pathname, pattern);
        removeFromRegistry();
        if (typeof cleanup === 'function') cleanup();
      };
      ws.on('close', onClose);
    });
  };
}
