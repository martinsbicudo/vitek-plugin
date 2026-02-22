/**
 * WebSocket upgrade handler for socket routes
 * Uses ws package for WebSocket handshake
 */

import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import type { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import { SOCKET_BASE_PATH } from '../../shared/constants.js';

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
}

export interface CreateSocketHandlerOptions {
  sockets: SocketEntry[];
  socketBasePath?: string;
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

/**
 * Creates an HTTP upgrade handler for WebSocket connections.
 * Registers with server.on('upgrade', handler).
 * Does not intercept /__vite (Vite HMR) or paths outside socketBasePath.
 */
export function createSocketHandler(options: CreateSocketHandlerOptions): (req: IncomingMessage, socket: Duplex, head: Buffer) => void {
  const { sockets, socketBasePath = SOCKET_BASE_PATH } = options;

  if (sockets.length === 0) {
    return () => {};
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

    wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
      const cleanup = socketEntry.handler({
        socket: ws,
        req,
        params,
        path: pathname,
      });

      if (typeof cleanup === 'function') {
        ws.on('close', cleanup);
      }
    });
  };
}
