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
import { API_BASE_PATH, GENERATED_TYPES_FILE, GENERATED_SERVICES_FILE } from '../../shared/constants.js';
import type { Route, RouteHandler, Middleware } from '../../core/routing/route-types.js';
import type { LoadedMiddleware } from '../../core/middleware/get-applicable-middlewares.js';
import type { VitekLogger } from './logger.js';

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
    middleware: createRequestHandler({
      routes: state.routes,
      middlewares: state.middlewares,
      logger: options.logger,
    }),
    cleanup: () => state.cleanup(),
    reload: () => state.reload(),
  };
}

