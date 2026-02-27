/**
 * Adapter for integration with Vite development server
 * Thin layer that connects core → Vite
 */

import type { ViteDevServer } from 'vite';
import * as path from 'path';
import * as fs from 'fs';
import { scanApiDirectory } from '../../core/file-system/scan-api-dir.js';
import { watchApiDirectory, type ApiWatcher } from '../../core/file-system/watch-api-dir.js';
import { createRoute } from '../../core/routing/route-parser.js';
import { createRequestHandler } from '../../core/server/request-handler.js';
import { routesToSchema } from '../../core/types/schema.js';
import { runFileGeneration } from '../../core/generation/run-file-generation.js';
import { patternToRegex } from '../../core/normalize/normalize-path.js';
import { createSocketHandler, type SocketEntry } from '../../core/socket/socket-handler.js';
import { extractBodyTypeFromFile, extractQueryTypeFromFile } from '../../core/file-system/extract-type-from-file.js';
import {
  API_BASE_PATH,
  SOCKET_BASE_PATH,
} from '../../shared/constants.js';
import type { ApiClient, SocketEmitter, VitekApp } from '../../core/shared/vitek-app.js';
import type { OpenApiOptions } from '../../core/openapi/generate.js';
import type { Route, RouteHandler, Middleware } from '../../core/routing/route-types.js';
import type { LoadedMiddleware } from '../../core/middleware/get-applicable-middlewares.js';
import type { BeforeApiRequestHook } from '../../core/server/request-handler.js';
import type { AfterTypesGeneratedContext } from '../../plugin/plugin-api.js';
import type { VitekLogger } from './logger.js';

function deduplicateRoutesByKey(routes: Route[]): Route[] {
  const seen = new Set<string>();
  return routes.filter((r) => {
    const key = `${r.method}:${r.pattern}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateSocketsByPattern<T extends { pattern: string }>(sockets: T[]): T[] {
  const seen = new Set<string>();
  return sockets.filter((s) => {
    if (seen.has(s.pattern)) return false;
    seen.add(s.pattern);
    return true;
  });
}

export interface ViteDevServerOptions {
  root: string;
  apiDir: string;
  logger: VitekLogger;
  viteServer: ViteDevServer;
  enableValidation?: boolean;
  openApi?: OpenApiOptions | boolean;
  sockets?: boolean;
  /** Base path for WebSocket endpoints (e.g. /api/ws). Default from constants. */
  socketBasePath?: string;
  /** Callback when types/services/OpenAPI generation fails. */
  onGenerationError?: (error: Error) => void;
  /** Hooks called before each API request. */
  beforeApiRequest?: BeforeApiRequestHook[];
  /** Hooks called after types/services/OpenAPI are generated. */
  afterTypesGenerated?: ((ctx: AfterTypesGeneratedContext) => void | Promise<void>)[];
  /** API base path (e.g. /api). Default from constants. */
  apiBasePath?: string;
  /** Enable CORS (true or CorsOptions). Passed to request handler. */
  cors?: boolean | import('../../core/server/cors.js').CorsOptions;
  /** Trust X-Forwarded-* headers. Passed to request handler. */
  trustProxy?: boolean;
}

/**
 * Development server state
 */
class DevServerState {
  routes: Route[] = [];
  middlewares: LoadedMiddleware[] = [];
  sockets: SocketEntry[] = [];
  watcher: ApiWatcher | null = null;
  
  constructor(
    private options: ViteDevServerOptions
  ) {}
  
  /**
   * Initializes the server: scan, load routes and middleware
   */
  async initialize() {
    await this.reload(false); // Don't show "Reloading" on initialization
    this.setupWatcher();
  }
  
  /**
   * Reloads routes and middleware
   */
  async reload(showReloadLog = true) {
    if (showReloadLog) {
      this.options.logger.info('Reloading API routes...');
    }

    const scanResult = scanApiDirectory(this.options.apiDir);

    this.middlewares.length = 0;
    for (const middlewareInfo of scanResult.middlewares) {
      try {
        const relativePath = path.relative(this.options.root, middlewareInfo.path);
        const vitePath = `/${relativePath.replace(/\\/g, '/')}`;
        const middlewareModule = await this.options.viteServer.ssrLoadModule(vitePath);
        const middleware = middlewareModule.default || middlewareModule.middleware;
        
        let middlewareArray: Middleware[] = [];
        if (Array.isArray(middleware)) {
          middlewareArray = middleware;
        } else if (typeof middleware === 'function') {
          middlewareArray = [middleware];
        }
        
        if (middlewareArray.length > 0) {
          this.middlewares.push({
            middleware: middlewareArray,
            basePattern: middlewareInfo.basePattern,
          });
        }
      } catch (error) {
        this.options.logger.warn(
          `Failed to load middleware ${middlewareInfo.path}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    const totalMiddlewareCount = this.middlewares.reduce((sum, m) => sum + m.middleware.length, 0);
    this.options.logger.middlewareLoaded(totalMiddlewareCount);

    this.routes.length = 0;
    for (const parsedRoute of scanResult.routes) {
      try {
        const relativePath = path.relative(this.options.root, parsedRoute.file);
        const vitePath = `/${relativePath.replace(/\\/g, '/')}`;
        const handlerModule = await this.options.viteServer.ssrLoadModule(vitePath);
        const handler: RouteHandler = handlerModule.default || handlerModule.handler || handlerModule[parsedRoute.method];
        
        if (typeof handler !== 'function') {
          this.options.logger.warn(
            `Route file ${parsedRoute.file} does not export a handler function`
          );
          continue;
        }

        const bodyType = extractBodyTypeFromFile(parsedRoute.file);
        const queryType = extractQueryTypeFromFile(parsedRoute.file);
        const route = createRoute(parsedRoute, handler, bodyType, queryType);
        this.routes.push(route);
      } catch (error) {
        this.options.logger.error(
          `Failed to load route ${parsedRoute.file}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    this.routes = deduplicateRoutesByKey(this.routes);

    const routesInfo = this.routes.map(r => ({
      method: r.method,
      pattern: r.pattern,
    }));
    this.options.logger.routesRegistered(routesInfo, API_BASE_PATH);

    this.sockets.length = 0;
    const socketsEnabled = this.options.sockets !== false;
    if (socketsEnabled) {
      for (const parsedSocket of scanResult.sockets) {
        try {
          const relativePath = path.relative(this.options.root, parsedSocket.file);
          const vitePath = `/${relativePath.replace(/\\/g, '/')}`;
          const handlerModule = await this.options.viteServer.ssrLoadModule(vitePath);
          const handler = handlerModule.default ?? handlerModule.handler;
          if (typeof handler !== 'function') {
            this.options.logger.warn(
              `Socket file ${parsedSocket.file} does not export a handler function`
            );
            continue;
          }
          const regex = patternToRegex(parsedSocket.pattern);
          this.sockets.push({
            pattern: parsedSocket.pattern,
            params: parsedSocket.params,
            file: parsedSocket.file,
            regex,
            handler,
          });
        } catch (error) {
          this.options.logger.error(
            `Failed to load socket ${parsedSocket.file}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    }

    this.sockets = deduplicateSocketsByPattern(this.sockets);

    const socketBasePath = this.options.socketBasePath ?? SOCKET_BASE_PATH;
    this.options.logger.socketsRegistered(
      this.sockets.map((s) => ({ pattern: s.pattern })),
      socketBasePath
    );

    await this.generateTypes();
  }
  
  /**
   * Sets up watcher to reload when files change
   */
  setupWatcher() {
    if (this.watcher) {
      this.watcher.close();
    }
    
    this.watcher = watchApiDirectory(this.options.apiDir, async (event, filePath) => {
      this.options.logger.info(`API file ${event}: ${filePath}`);
      await this.reload();
    });
  }
  
  async generateTypes() {
    try {
      const schema = routesToSchema(this.routes);
      const socketBasePath = this.options.socketBasePath ?? SOCKET_BASE_PATH;
      const port = this.options.viteServer.config.server?.port || 5173;

      await runFileGeneration({
        root: this.options.root,
        schema,
        sockets: this.sockets,
        apiBasePath: API_BASE_PATH,
        socketBasePath,
        openApi: this.options.openApi,
        serverPort: port,
        logger: {
          typesGenerated: (p) => this.options.logger.typesGenerated(p),
          servicesGenerated: (p) => this.options.logger.servicesGenerated(p),
          info: (m) => this.options.logger.info(m),
          warn: (m) => this.options.logger.warn(m),
        },
        onGenerationError: this.options.onGenerationError,
      });
      const apiBasePath = this.options.apiBasePath ?? API_BASE_PATH;
      for (const hook of this.options.afterTypesGenerated ?? []) {
        await hook({
          root: this.options.root,
          schema,
          sockets: this.sockets.map((s) => ({ pattern: s.pattern, params: s.params, file: s.file })),
          apiBasePath,
          socketBasePath,
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.options.logger.error(`Failed to generate types: ${err.message}`);
      this.options.onGenerationError?.(err);
    }
  }
  
  /**
   * Cleans up resources
   */
  cleanup() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}

const noopEmitter: SocketEmitter = {
  emit() {},
};

/**
 * Creates middleware for Vite development server
 */
export function createViteDevServerMiddleware(options: ViteDevServerOptions) {
  const state = new DevServerState(options);
  const ready = state.initialize().catch(error => {
    options.logger.error(`Failed to initialize Vitek: ${error instanceof Error ? error.message : String(error)}`);
  });

  const port = options.viteServer.config.server.port ?? 5173;
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
    middleware: createRequestHandler({
      routes: state.routes,
      middlewares: state.middlewares,
      beforeApiRequest: options.beforeApiRequest,
      cors: options.cors,
      trustProxy: options.trustProxy,
      logger: options.logger,
      shared,
    }),
    cleanup: () => state.cleanup(),
    reload: () => state.reload(),
    setupSockets: (httpServer: { on(event: 'upgrade', listener: (req: import('http').IncomingMessage, socket: import('stream').Duplex, head: Buffer) => void): void }) => {
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
    },
  };
}

