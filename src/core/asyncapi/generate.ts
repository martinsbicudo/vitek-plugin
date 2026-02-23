/**
 * AsyncAPI specification generation for WebSocket endpoints
 * Core logic - no Vite dependencies
 */

import * as fs from 'fs';
import * as path from 'path';
import type { SocketEntry } from '../socket/socket-handler.js';

export interface AsyncApiInfo {
  title?: string;
  version?: string;
  description?: string;
}

export interface AsyncApiOptions {
  info?: AsyncApiInfo;
  /** Server URL for WebSocket (e.g. ws://localhost:5173). Defaults to current origin with ws(s). */
  serverUrl?: string;
}

const DEFAULT_ASYNCAPI_INFO: AsyncApiInfo = {
  title: 'Vitek WebSocket API',
  version: '1.0.0',
  description: 'WebSocket endpoints (auto-generated from socket routes)',
};

function fullSocketPath(basePath: string, pattern: string): string {
  const base = basePath.replace(/\/$/, '');
  return pattern === '' ? base : `${base}/${pattern}`;
}

/**
 * Generates AsyncAPI 2.x specification from socket entries
 */
export function generateAsyncApiSpec(
  sockets: SocketEntry[],
  socketBasePath: string,
  options: AsyncApiOptions = {}
): object {
  const info = { ...DEFAULT_ASYNCAPI_INFO, ...options.info };
  const channels: Record<string, unknown> = {};

  for (const socket of sockets) {
    const channelPath = fullSocketPath(socketBasePath, socket.pattern);
    const description =
      socket.pattern === ''
        ? 'Root WebSocket endpoint'
        : `WebSocket: ${channelPath}`;
    channels[channelPath] = {
      description,
      subscribe: {
        operationId: `onMessage_${channelPath.replace(/\//g, '_')}`,
        message: {
          description: 'Incoming message',
          payload: { type: 'object', description: 'JSON payload' },
        },
      },
      publish: {
        operationId: `send_${channelPath.replace(/\//g, '_')}`,
        message: {
          description: 'Outgoing message',
          payload: { type: 'object', description: 'JSON payload' },
        },
      },
    };
  }

  const serverUrl = options.serverUrl ?? 'ws://localhost:5173';
  const spec: Record<string, unknown> = {
    asyncapi: '2.4.0',
    info: {
      title: info.title,
      version: info.version ?? '1.0.0',
      description: info.description,
    },
    servers: {
      development: {
        url: serverUrl,
        protocol: serverUrl.startsWith('wss') ? 'wss' : 'ws',
        description: 'Development server',
      },
    },
    channels,
  };

  return spec;
}

/**
 * Writes AsyncAPI spec to a JSON file
 */
export async function generateAsyncApiFile(
  outputPath: string,
  sockets: SocketEntry[],
  socketBasePath: string,
  options: AsyncApiOptions = {}
): Promise<void> {
  const spec = generateAsyncApiSpec(sockets, socketBasePath, options);
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2), 'utf-8');
}
