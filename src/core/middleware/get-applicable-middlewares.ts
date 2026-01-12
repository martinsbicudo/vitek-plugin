/**
 * Determines which middlewares are applicable to a route based on the pattern
 * Core logic - no dependencies
 */

import type { Middleware } from '../routing/route-types.js';
import type { MiddlewareInfo } from '../file-system/scan-api-dir.js';

/**
 * Information about a loaded middleware (with the middleware function already imported)
 */
export interface LoadedMiddleware {
  middleware: Middleware[];
  basePattern: string;
}

/**
 * Checks if a middleware base pattern applies to a route pattern
 * A middleware applies if its basePattern is a prefix of the routePattern
 * 
 * Examples:
 * - basePattern: "" → applies to all routes (global)
 * - basePattern: "posts" → applies to "posts", "posts/:id", "posts/:id/comments", etc
 * - basePattern: "posts/:id" → applies to "posts/:id", "posts/:id/comments", but not to "posts"
 */
function isMiddlewareApplicable(basePattern: string, routePattern: string): boolean {
  // Global middleware (empty basePattern) applies to all routes
  if (basePattern === '') {
    return true;
  }
  
  // If route is empty (root), only global middleware applies
  if (routePattern === '') {
    return false;
  }
  
  // Normalize patterns for comparison (remove leading/trailing slashes)
  const normalizedBase = basePattern.replace(/^\/+|\/+$/g, '');
  const normalizedRoute = routePattern.replace(/^\/+|\/+$/g, '');
  
  // Check if basePattern is an exact prefix of routePattern
  // Or if route starts with basePattern followed by /
  if (normalizedRoute === normalizedBase) {
    return true;
  }
  
  if (normalizedRoute.startsWith(normalizedBase + '/')) {
    return true;
  }
  
  return false;
}

/**
 * Returns the middlewares applicable to a route, ordered from most generic to most specific
 */
export function getApplicableMiddlewares(
  middlewares: LoadedMiddleware[],
  routePattern: string
): Middleware[] {
  const applicable: Middleware[] = [];
  
  for (const loadedMiddleware of middlewares) {
    if (isMiddlewareApplicable(loadedMiddleware.basePattern, routePattern)) {
      applicable.push(...loadedMiddleware.middleware);
    }
  }
  
  return applicable;
}

