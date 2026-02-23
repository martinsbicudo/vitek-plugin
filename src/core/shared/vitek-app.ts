/**
 * Shared app types for REST and WebSocket integration.
 * Types only; no Vite/Node coupling in core.
 */

export interface SocketEmitter {
  /** Broadcast to all clients connected to this socket path (pattern). path = '' for root, 'chat' for /api/ws/chat */
  emit(path: string, data: string | Buffer | object): void;
}

export interface ApiClient {
  /** Call the REST API internally. path is relative to API_BASE_PATH, e.g. 'health' or 'users/1' */
  fetch(
    path: string,
    options?: { method?: string; body?: unknown },
  ): Promise<unknown>;
}

export interface VitekApp {
  sockets: SocketEmitter;
  api: ApiClient;
}
