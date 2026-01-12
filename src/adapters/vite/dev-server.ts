/**
 * Adapter for integration with Vite development server
 * Thin layer that connects core → Vite
 */

import type { Connect, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import * as path from 'path';
import * as fs from 'fs';
import { scanApiDirectory, type MiddlewareInfo } from '../../core/file-system/scan-api-dir.js';

/**
 * Detects if the project uses TypeScript by checking if tsconfig.json exists
 */
function isTypeScriptProject(root: string): boolean {
  const tsconfigPath = path.join(root, 'tsconfig.json');
  return fs.existsSync(tsconfigPath);
}
import { watchApiDirectory, type ApiWatcher } from '../../core/file-system/watch-api-dir.js';
import { createRoute } from '../../core/routing/route-parser.js';
import { matchRoute } from '../../core/routing/route-matcher.js';
import { compose } from '../../core/middleware/compose.js';
import { getApplicableMiddlewares, type LoadedMiddleware } from '../../core/middleware/get-applicable-middlewares.js';
import { createContext, isVitekResponse, type VitekResponse } from '../../core/context/create-context.js';
import { routesToSchema } from '../../core/types/schema.js';
import { generateTypesFile, generateServicesFile } from '../../core/types/generate.js';
import { API_BASE_PATH, GENERATED_TYPES_FILE, GENERATED_SERVICES_FILE } from '../../shared/constants.js';
import type { Route, RouteHandler, Middleware } from '../../core/routing/route-types.js';
import type { VitekLogger } from './logger.js';
import { HttpError } from '../../shared/errors.js';

export interface ViteDevServerOptions {
  root: string;
  apiDir: string;
  logger: VitekLogger;
  viteServer: ViteDevServer;
  enableValidation?: boolean;
}

/**
 * Development server state
 */
class DevServerState {
  routes: Route[] = [];
  middlewares: LoadedMiddleware[] = []; // Loaded hierarchical middlewares
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
    
    // Scan directory
    const scanResult = scanApiDirectory(this.options.apiDir);
    
    // Load hierarchical middlewares
    this.middlewares = [];
    for (const middlewareInfo of scanResult.middlewares) {
      try {
        // Convert absolute path to relative path to Vite root (format /src/api/posts/middleware.ts)
        const relativePath = path.relative(this.options.root, middlewareInfo.path);
        const vitePath = `/${relativePath.replace(/\\/g, '/')}`;
        
        // Use Vite's ssrLoadModule to process TypeScript
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
    
    // Load routes
    this.routes = [];
    for (const parsedRoute of scanResult.routes) {
      try {
        // Convert absolute path to relative path to Vite root (format /src/api/users/[id].get.ts)
        const relativePath = path.relative(this.options.root, parsedRoute.file);
        const vitePath = `/${relativePath.replace(/\\/g, '/')}`;
        
        // Use Vite's ssrLoadModule to process TypeScript
        const handlerModule = await this.options.viteServer.ssrLoadModule(vitePath);
        const handler: RouteHandler = handlerModule.default || handlerModule.handler || handlerModule[parsedRoute.method];
        
        if (typeof handler !== 'function') {
          this.options.logger.warn(
            `Route file ${parsedRoute.file} does not export a handler function`
          );
          continue;
        }
        
        // Extract bodyType from file (looking for export type Body or export interface Body)
        const bodyType = extractBodyTypeFromFile(parsedRoute.file);
        // Extract queryType from file (looking for export type Query or export interface Query)
        const queryType = extractQueryTypeFromFile(parsedRoute.file);
        
        const route = createRoute(parsedRoute, handler, bodyType, queryType);
        this.routes.push(route);
      } catch (error) {
        this.options.logger.error(
          `Failed to load route ${parsedRoute.file}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    
    // Log registered routes (consolidated)
    const routesInfo = this.routes.map(r => ({
      method: r.method,
      pattern: r.pattern,
    }));
    this.options.logger.routesRegistered(routesInfo, API_BASE_PATH);
    
    // Generate types
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
      
      // Generate api.types.ts only if it's a TypeScript project
      if (isTypeScript) {
        const typesPath = path.join(this.options.root, 'src', GENERATED_TYPES_FILE);
        await generateTypesFile(typesPath, schema, API_BASE_PATH);
        const relativeTypesPath = path.relative(this.options.root, typesPath);
        this.options.logger.typesGenerated(`./${relativeTypesPath.replace(/\\/g, '/')}`);
      }
      
      // Generate api.services.ts or api.services.js depending on the project
      const servicesFileName = isTypeScript ? GENERATED_SERVICES_FILE : 'api.services.js';
      const servicesPath = path.join(this.options.root, 'src', servicesFileName);
      await generateServicesFile(servicesPath, schema, API_BASE_PATH, isTypeScript);
      
      const relativeServicesPath = path.relative(this.options.root, servicesPath);
      this.options.logger.servicesGenerated(`./${relativeServicesPath.replace(/\\/g, '/')}`);
    } catch (error) {
      this.options.logger.error(
        `Failed to generate types: ${error instanceof Error ? error.message : String(error)}`
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
 * Helper function to extract a type from a file
 * Uses regex-based extraction (synchronous)
 * 
 * Note: AST-based extraction using ts-morph would be more robust but requires:
 * 1. Making this function async
 * 2. Adding ts-morph as optional dependency
 * 3. Updating call sites to handle async
 * This can be implemented in a future version when needed.
 */
function extractTypeFromFile(filePath: string, typeName: string): string | undefined {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Look for export type {TypeName} = ...
    const typeStart = content.indexOf(`export type ${typeName}`);
    if (typeStart !== -1) {
      const afterStart = content.substring(typeStart);
      const equalsIndex = afterStart.indexOf('=');
      if (equalsIndex !== -1) {
        const afterEquals = afterStart.substring(equalsIndex + 1).trimStart();
        
        // If it starts with {, need to count braces to find the correct closing
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
          // If it doesn't start with {, it's a simple type alias (e.g., string, number, etc)
          // Get until the first ; (but may have line breaks)
          const semicolonIndex = afterEquals.indexOf(';');
          if (semicolonIndex !== -1) {
            return afterEquals.substring(0, semicolonIndex).trim();
          }
        }
      }
    }
    
    // Look for export interface {TypeName} { ... }
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
  } catch (error) {
    // If unable to read the file, return undefined
    return undefined;
  }
}

/**
 * Creates middleware for Vite development server
 */
export function createViteDevServerMiddleware(options: ViteDevServerOptions) {
  const state = new DevServerState(options);
  
  // Initialize when middleware is created
  state.initialize().catch(error => {
    options.logger.error(`Failed to initialize Vitek: ${error instanceof Error ? error.message : String(error)}`);
  });
  
  return {
    middleware: async (
      req: IncomingMessage,
      res: ServerResponse,
      next: Connect.NextFunction
    ) => {
      // Only process requests for /api/*
      if (!req.url?.startsWith(API_BASE_PATH)) {
        return next();
      }
      
      const startTime = Date.now();
      const requestMethod = req.method?.toLowerCase() || 'get';
      const requestPath = req.url.split('?')[0]; // Path without query string
      
      try {
        // Parse URL to separate path from query string
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        
        // Remove /api from path for matching
        const routePath = url.pathname.replace(API_BASE_PATH, '') || '/';
        const method = requestMethod;
        
        // Try to match with a route
        const match = matchRoute(state.routes, routePath, method);
        
        if (!match) {
          const duration = Date.now() - startTime;
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Route not found' }));
          options.logger.request(requestMethod, requestPath, 404, duration);
          return;
        }
        
        // Log route match if enabled
        options.logger.routeMatched(match.route.pattern, method);
        
        // Parse query string (url was already created above)
        const query: Record<string, string | string[]> = {};
        url.searchParams.forEach((value, key) => {
          if (query[key]) {
            const existing = query[key];
            query[key] = Array.isArray(existing) ? [...existing, value] : [existing as string, value];
          } else {
            query[key] = value;
          }
        });
        
        // Parse body if present
        let body: any;
        if (['post', 'put', 'patch'].includes(method)) {
          body = await new Promise((resolve) => {
            const chunks: Buffer[] = [];
            req.on('data', (chunk: Buffer) => {
              chunks.push(chunk);
            });
            req.on('end', () => {
              const rawBody = Buffer.concat(chunks).toString();
              if (!rawBody) {
                resolve(undefined);
                return;
              }
              try {
                resolve(JSON.parse(rawBody));
              } catch {
                resolve(rawBody);
              }
            });
          });
        }
        
        // Create context
        const context = createContext(
          {
            url: req.url,
            method,
            headers: req.headers as Record<string, string>,
            body,
          },
          match.params,
          query
        );
        
        // Note: Validation is opt-in and can be done manually in handlers using validateBody/validateQuery
        // Automatic validation based on TypeScript types would require AST parsing (Phase 2.2)
        // For now, validation is available as helper functions that handlers can use
        
        // Get applicable middlewares for this route
        const applicableMiddlewares = getApplicableMiddlewares(state.middlewares, match.route.pattern);
        
        // Compose middlewares + handler
        const composed = compose(applicableMiddlewares);
        const handler = async () => {
          const result = await match.route.handler(context);
          
          // Handle VitekResponse format (with status and headers)
          if (isVitekResponse(result)) {
            const response = result as VitekResponse;
            const statusCode = response.status || 200;
            
            // Set headers
            if (response.headers) {
              for (const [key, value] of Object.entries(response.headers)) {
                res.setHeader(key, value);
              }
            }
            
            // Set default Content-Type if not specified and body exists
            if (!response.headers || !response.headers['Content-Type']) {
              if (response.body !== undefined) {
                res.setHeader('Content-Type', 'application/json');
              }
            }
            
            res.statusCode = statusCode;
            
            // Handle different response types
            if (response.body === undefined) {
              res.end();
            } else if (typeof response.body === 'string') {
              res.end(response.body);
            } else {
              res.end(JSON.stringify(response.body));
            }
            
            // Log request/response
            const duration = Date.now() - startTime;
            options.logger.request(requestMethod, requestPath, statusCode, duration);
          } else {
            // Backward compatibility: plain object/primitive → JSON response with status 200
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(result));
            
            // Log request/response
            const duration = Date.now() - startTime;
            options.logger.request(requestMethod, requestPath, 200, duration);
          }
        };
        
        await composed(context, handler);
        
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Handle HTTP errors with proper status codes
        if (error instanceof HttpError) {
          const httpError = error as HttpError;
          options.logger.warn(
            `HTTP Error ${httpError.statusCode}: ${httpError.message}`
          );
          res.statusCode = httpError.statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: httpError.name,
            message: httpError.message,
            code: httpError.code,
          }));
          
          // Log request/response
          options.logger.request(requestMethod, requestPath, httpError.statusCode, duration);
        } else {
          // Generic error handling (backward compatible)
          const errorMessage = error instanceof Error ? error.message : String(error);
          options.logger.error(
            `Error handling request: ${errorMessage}`
          );
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: 'Internal server error',
            message: errorMessage,
          }));
          
          // Log request/response
          options.logger.request(requestMethod, requestPath, 500, duration);
        }
      }
    },
    
    cleanup: () => state.cleanup(),
    reload: () => state.reload(),
  };
}

