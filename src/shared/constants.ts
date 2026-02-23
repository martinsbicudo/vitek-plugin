/**
 * Constantes compartilhadas do Vitek
 */

export const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;
export type HttpMethod = typeof HTTP_METHODS[number];

export const API_BASE_PATH = '/api';
export const API_DIR_NAME = 'api';
export const GENERATED_TYPES_FILE = 'api.types.ts';
export const GENERATED_SERVICES_FILE = 'api.services.ts';

// Padrões de nomeação de arquivos
export const ROUTE_FILE_PATTERN = /^(.+)\.(get|post|put|patch|delete|head|options)\.(ts|js)$/;
export const MIDDLEWARE_FILE_PATTERN = /^middleware\.(ts|js)$/;
export const SOCKET_FILE_PATTERN = /^(.+)\.socket\.(ts|js)$/;
export const PARAM_PATTERN = /\[(\.\.\.)?([^\]]+)\]/g;

// WebSocket (default: under API path)
export const SOCKET_BASE_PATH = `${API_BASE_PATH}/ws`;

/**
 * Resolves socket base path. Use when apiBasePath or custom socket path may override.
 * Plugin option sockets: { path: '/ws' } uses path as-is; otherwise defaults to apiBasePath + '/ws'.
 */
export function getSocketBasePath(apiBasePath?: string, customSocketPath?: string): string {
  if (customSocketPath != null && customSocketPath !== '') {
    return customSocketPath.startsWith('/') ? customSocketPath : `/${customSocketPath}`;
  }
  const base = apiBasePath ?? API_BASE_PATH;
  return base.endsWith('/') ? `${base.slice(0, -1)}/ws` : `${base}/ws`;
}

export const GENERATED_SOCKET_TYPES_FILE = 'socket.types.ts';
export const GENERATED_SOCKET_SERVICES_FILE = 'socket.services.ts';
export const VITEK_SOCKETS_BUNDLE_FILENAME = 'vitek-sockets.mjs';

