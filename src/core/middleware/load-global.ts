/**
 * Global middleware loading
 * Core logic - runtime agnostic
 */

import type { Middleware } from '../routing/route-types.js';

/**
 * Loads global middleware from a module
 * The module must export a default or named export 'middleware'
 * 
 * @param middlewarePath - Absolute path to the middleware file
 */
export async function loadGlobalMiddleware(middlewarePath: string): Promise<Middleware[]> {
  try {
    // Dynamic import - converts to URL for Vite/Node compatibility
    const { pathToFileURL } = await import('node:url');
    const moduleUrl = pathToFileURL(middlewarePath).href;
    const module = await import(moduleUrl);
    
    // Supports both default export and named export
    const middleware = module.default || module.middleware;
    
    if (!middleware) {
      return [];
    }
    
    // If it's an array, return directly
    if (Array.isArray(middleware)) {
      return middleware;
    }
    
    // If it's a single function, return as array
    if (typeof middleware === 'function') {
      return [middleware];
    }
    
    return [];
  } catch (error) {
    // If file doesn't exist or has no middleware, return empty array
    // This allows middleware to be optional
    return [];
  }
}

