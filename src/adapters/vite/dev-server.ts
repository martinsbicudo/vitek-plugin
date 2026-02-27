import { API_BASE_PATH } from '../../shared/constants.js';
import type { ApiClient, SocketEmitter, VitekApp } from '../../core/shared/vitek-app.js';
import { DevServerState, type ViteDevServerOptions } from './dev-server-state.js';
import { createApiMiddleware, createSocketSetup } from './dev-server-middleware.js';

const noopEmitter: SocketEmitter = {
  emit() {},
};

export type { ViteDevServerOptions } from './dev-server-state.js';

export function createViteDevServerMiddleware(options: ViteDevServerOptions) {
  const state = new DevServerState(options);
  const ready = state.initialize().catch((error) => {
    options.logger.error(`Failed to initialize Vitek: ${error instanceof Error ? error.message : String(error)}`);
  });

  const port = options.viteServer.config.server?.port ?? 5173;
  const apiBaseUrl = `http://127.0.0.1:${port}${API_BASE_PATH}`;
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

  const shared: VitekApp = {
    sockets: noopEmitter,
    api,
  };

  return {
    ready,
    middleware: createApiMiddleware(state, options, shared),
    cleanup: () => state.cleanup(),
    reload: () => state.reload(),
    setupSockets: createSocketSetup(state, options, shared),
  };
}
