import type { ViteDevServer } from 'vite';
import * as path from 'path';
import { scanApiDirectory } from '../../core/file-system/scan-api-dir.js';
import { watchApiDirectory, type ApiWatcher } from '../../core/file-system/watch-api-dir.js';
import { createRoute } from '../../core/routing/route-parser.js';
import { routesToSchema } from '../../core/types/schema.js';
import { runFileGeneration } from '../../core/generation/run-file-generation.js';
import { patternToRegex } from '../../core/normalize/normalize-path.js';
import { createSocketHandler, type SocketEntry } from '../../core/socket/socket-handler.js';
import { extractBodyTypeFromFile, extractQueryTypeFromFile } from '../../core/file-system/extract-type-from-file.js';
import { API_BASE_PATH, SOCKET_BASE_PATH } from '../../shared/constants.js';
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
  socketBasePath?: string;
  onGenerationError?: (error: Error) => void;
  beforeApiRequest?: BeforeApiRequestHook[];
  afterTypesGenerated?: ((ctx: AfterTypesGeneratedContext) => void | Promise<void>)[];
  apiBasePath?: string;
  cors?: boolean | import('../../core/server/cors.js').CorsOptions;
  trustProxy?: boolean;
  maxBodySize?: number;
  onError?: (err: Error, req: import('http').IncomingMessage, res: import('http').ServerResponse) => void | Promise<void>;
  production?: boolean;
}

export class DevServerState {
  routes: Route[] = [];
  middlewares: LoadedMiddleware[] = [];
  sockets: SocketEntry[] = [];
  watcher: ApiWatcher | null = null;

  constructor(private options: ViteDevServerOptions) {}

  async initialize() {
    await this.reload(false);
    this.setupWatcher();
  }

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
          let pathPatterns: string[] | undefined;
          if (middlewareInfo.basePattern === '' && middlewareModule.config?.path) {
            const raw = Array.isArray(middlewareModule.config.path) ? middlewareModule.config.path : [middlewareModule.config.path];
            pathPatterns = raw.map((p: string) => String(p).replace(/^\/api\/?/, '').replace(/^\/+|\/+$/g, '')).filter(Boolean);
          }
          this.middlewares.push({
            middleware: middlewareArray,
            basePattern: middlewareInfo.basePattern,
            pathPatterns,
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

    const routesInfo = this.routes.map((r) => ({
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

  cleanup() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
