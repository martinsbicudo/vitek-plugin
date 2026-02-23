/**
 * Adapter for integration with Vite development server
 * Thin layer that connects core → Vite
 */

import type { ViteDevServer } from 'vite';
import * as path from 'path';
import * as fs from 'fs';
import { scanApiDirectory } from '../../core/file-system/scan-api-dir.js';

/**
 * Detects if the project uses TypeScript by checking if tsconfig.json exists
 */
function isTypeScriptProject(root: string): boolean {
  const tsconfigPath = path.join(root, 'tsconfig.json');
  return fs.existsSync(tsconfigPath);
}
import { watchApiDirectory, type ApiWatcher } from '../../core/file-system/watch-api-dir.js';
import { createRoute } from '../../core/routing/route-parser.js';
import { createRequestHandler } from '../../core/server/request-handler.js';
import { routesToSchema } from '../../core/types/schema.js';
import { generateTypesFile, generateServicesFile } from '../../core/types/generate.js';
import { generateSocketTypesFile } from '../../core/types/generate-socket-types.js';
import { generateSocketServicesFile } from '../../core/types/generate-socket-services.js';
import { patternToRegex } from '../../core/normalize/normalize-path.js';
import { createSocketHandler, type SocketEntry } from '../../core/socket/socket-handler.js';
import { generateOpenApiFile, generateApiDocsHtml } from '../../core/openapi/generate.js';
import { generateAsyncApiFile } from '../../core/asyncapi/generate.js';
import {
  API_BASE_PATH,
  SOCKET_BASE_PATH,
  GENERATED_TYPES_FILE,
  GENERATED_SERVICES_FILE,
  GENERATED_SOCKET_TYPES_FILE,
  GENERATED_SOCKET_SERVICES_FILE,
} from '../../shared/constants.js';
import type { ApiClient, SocketEmitter, VitekApp } from '../../core/shared/vitek-app.js';
import type { OpenApiOptions } from '../../core/openapi/generate.js';
import type { Route, RouteHandler, Middleware } from '../../core/routing/route-types.js';
import type { LoadedMiddleware } from '../../core/middleware/get-applicable-middlewares.js';
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
  
  /**
   * Generates types and services files
   */
  async generateTypes() {
    try {
      const schema = routesToSchema(this.routes);
      const isTypeScript = isTypeScriptProject(this.options.root);

      if (isTypeScript) {
        const typesPath = path.join(this.options.root, 'src', GENERATED_TYPES_FILE);
        await generateTypesFile(typesPath, schema, API_BASE_PATH);
        const relativeTypesPath = path.relative(this.options.root, typesPath);
        this.options.logger.typesGenerated(`./${relativeTypesPath.replace(/\\/g, '/')}`);
      }

      const servicesFileName = isTypeScript ? GENERATED_SERVICES_FILE : 'api.services.js';
      const servicesPath = path.join(this.options.root, 'src', servicesFileName);
      await generateServicesFile(servicesPath, schema, API_BASE_PATH, isTypeScript);
      
      const relativeServicesPath = path.relative(this.options.root, servicesPath);
      this.options.logger.servicesGenerated(`./${relativeServicesPath.replace(/\\/g, '/')}`);

      if (this.sockets.length > 0) {
        const socketSchema = this.sockets.map((s) => ({
          pattern: s.pattern,
          params: s.params,
          file: s.file,
        }));
        const socketBasePath = this.options.socketBasePath ?? SOCKET_BASE_PATH;
        if (isTypeScript) {
          const socketTypesPath = path.join(this.options.root, 'src', GENERATED_SOCKET_TYPES_FILE);
          await generateSocketTypesFile(socketTypesPath, socketSchema, socketBasePath);
          const relativeSocketTypesPath = path.relative(this.options.root, socketTypesPath);
          this.options.logger.typesGenerated(`./${relativeSocketTypesPath.replace(/\\/g, '/')}`);
        }

        const socketServicesFileName = isTypeScript ? GENERATED_SOCKET_SERVICES_FILE : 'socket.services.js';
        const socketServicesPath = path.join(this.options.root, 'src', socketServicesFileName);
        await generateSocketServicesFile(socketServicesPath, socketSchema, socketBasePath, isTypeScript);
        const relativeSocketServicesPath = path.relative(this.options.root, socketServicesPath);
        this.options.logger.servicesGenerated(`./${relativeSocketServicesPath.replace(/\\/g, '/')}`);
      }

      // Generate OpenAPI spec if enabled
      await this.generateOpenApi();
    } catch (error) {
      this.options.logger.error(
        `Failed to generate types: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generates OpenAPI specification and Swagger UI
   */
  async generateOpenApi() {
    const { openApi } = this.options;
    if (!openApi) {
      return;
    }

    try {
      const openApiOptions: OpenApiOptions = typeof openApi === 'boolean' 
        ? {
            apiBasePath: API_BASE_PATH,
          }
        : { ...openApi, apiBasePath: API_BASE_PATH };

      // Generate openapi.json
      const openApiPath = path.join(this.options.root, 'public', 'openapi.json');
      await generateOpenApiFile(openApiPath, this.routes, openApiOptions);
      const relativeOpenApiPath = path.relative(this.options.root, openApiPath);
      this.options.logger.info(`OpenAPI spec generated: ./${relativeOpenApiPath.replace(/\\/g, '/')}`);

      const port = this.options.viteServer.config.server?.port || 5173;
      const socketBasePath = this.options.socketBasePath ?? SOCKET_BASE_PATH;
      const hasSockets = this.sockets.length > 0;

      if (hasSockets) {
        const asyncApiPath = path.join(this.options.root, 'public', 'asyncapi.json');
        await generateAsyncApiFile(asyncApiPath, this.sockets, socketBasePath, {
          serverUrl: `ws://localhost:${port}`,
        });
        const relativeAsyncPath = path.relative(this.options.root, asyncApiPath);
        this.options.logger.info(`AsyncAPI spec generated: ./${relativeAsyncPath.replace(/\\/g, '/')}`);
      }

      // Generate API docs HTML (Swagger UI only, or REST + WebSockets tabs)
      const apiDocsPath = path.join(this.options.root, 'public', 'api-docs.html');
      const title = openApiOptions.info?.title || 'Vitek API';
      const apiDocsHtml = generateApiDocsHtml('/openapi.json', title, {
        asyncApiJsonPath: hasSockets ? '/asyncapi.json' : undefined,
      });
      fs.writeFileSync(apiDocsPath, apiDocsHtml, 'utf-8');
      const relativeApiDocsPath = path.relative(this.options.root, apiDocsPath);
      this.options.logger.info(`API docs at: ./${relativeApiDocsPath.replace(/\\/g, '/')} → http://localhost:${port}/api-docs.html`);
    } catch (error) {
      this.options.logger.warn(
        `Failed to generate OpenAPI spec: ${error instanceof Error ? error.message : String(error)}`
      );
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

/**
 * Extracts the body type from a route file
 * Looks for export type Body = ... or export interface Body { ... }
 * Returns the complete type definition as a string
 */
function extractBodyTypeFromFile(filePath: string): string | undefined {
  return extractTypeFromFile(filePath, 'Body');
}

/**
 * Extracts the query type from a route file
 * Looks for export type Query = ... or export interface Query { ... }
 * Returns the complete type definition as a string
 */
function extractQueryTypeFromFile(filePath: string): string | undefined {
  return extractTypeFromFile(filePath, 'Query');
}

/**
 * Extracts a type (Body or Query) from a route file via regex. AST-based extraction could be used in a future version.
 */
function extractTypeFromFile(filePath: string, typeName: string): string | undefined {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    const typeStart = content.indexOf(`export type ${typeName}`);
    if (typeStart !== -1) {
      const afterStart = content.substring(typeStart);
      const equalsIndex = afterStart.indexOf('=');
      if (equalsIndex !== -1) {
        const afterEquals = afterStart.substring(equalsIndex + 1).trimStart();

        if (afterEquals.startsWith('{')) {
          let braceCount = 0;
          let i = 0;
          let foundClose = false;
          
          for (; i < afterEquals.length; i++) {
            if (afterEquals[i] === '{') {
              braceCount++;
            } else if (afterEquals[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                foundClose = true;
                break;
              }
            }
          }
          
          if (foundClose) {
            const typeBody = afterEquals.substring(0, i + 1).trim();
            return typeBody;
          }
        } else {
          const semicolonIndex = afterEquals.indexOf(';');
          if (semicolonIndex !== -1) {
            return afterEquals.substring(0, semicolonIndex).trim();
          }
        }
      }
    }

    const interfaceStart = content.indexOf(`export interface ${typeName}`);
    if (interfaceStart !== -1) {
      const afterStart = content.substring(interfaceStart);
      const openBrace = afterStart.indexOf('{');
      if (openBrace !== -1) {
        let braceCount = 0;
        let i = openBrace;
        let foundClose = false;
        
        for (; i < afterStart.length; i++) {
          if (afterStart[i] === '{') {
            braceCount++;
          } else if (afterStart[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              foundClose = true;
              break;
            }
          }
        }
        
        if (foundClose) {
          const interfaceBody = afterStart.substring(openBrace + 1, i).trim();
          return `{ ${interfaceBody} }`;
        }
      }
    }
    
    return undefined;
  } catch {
    return undefined;
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

