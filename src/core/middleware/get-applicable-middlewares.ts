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
  /** Optional path matcher for global middleware (basePattern ''). Only routes matching one of these patterns get this middleware. E.g. ['protected/*', 'admin'] */
  pathPatterns?: string[];
}

/**
 * Returns true if routePattern matches a single path pattern.
 * Pattern may be exact ('admin') or prefix with * ('admin/*'). No leading slash.
 */
export function matchPathPattern(routePattern: string, configPattern: string): boolean {
  const route = routePattern.replace(/^\/+|\/+$/g, '');
  const pattern = configPattern.replace(/^\/+|\/+$/g, '');
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2);
    return route === prefix || route.startsWith(prefix + '/');
  }
  return route === pattern || route.startsWith(pattern + '/');
}

/**
 * Checks if a middleware base pattern applies to a route pattern
 * A middleware applies if its basePattern is a prefix of the routePattern
 * For global middleware (basePattern '') with pathPatterns, applies only if route matches one of them.
 */
function isMiddlewareApplicable(loaded: LoadedMiddleware, routePattern: string): boolean {
  const { basePattern, pathPatterns } = loaded;

  // Global middleware (empty basePattern)
  if (basePattern === '') {
    if (pathPatterns != null && pathPatterns.length > 0) {
      return pathPatterns.some((p) => matchPathPattern(routePattern, p));
    }
    return true;
  }

  // If route is empty (root), only global middleware applies
  if (routePattern === '') {
    return false;
  }

  const normalizedBase = basePattern.replace(/^\/+|\/+$/g, '');
  const normalizedRoute = routePattern.replace(/^\/+|\/+$/g, '');

  if (normalizedRoute === normalizedBase) return true;
  if (normalizedRoute.startsWith(normalizedBase + '/')) return true;
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
    if (isMiddlewareApplicable(loadedMiddleware, routePattern)) {
      applicable.push(...loadedMiddleware.middleware);
    }
  }

  return applicable;
}

