/**
 * Route matching against requests
 * Core logic - no Vite dependencies
 */

import type { Route, RouteMatch } from './route-types.js';
import { normalizePath } from '../../shared/utils.js';

/**
 * Finds the route that matches a path and method
 */
export function matchRoute(
  routes: Route[],
  path: string,
  method: string
): RouteMatch | null {
  // Normalize path ensuring it starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedMethod = method.toLowerCase();
  
  // Filter routes by method
  const methodRoutes = routes.filter(r => r.method === normalizedMethod);
  
  // Try to match in order
  for (const route of methodRoutes) {
    const match = normalizedPath.match(route.regex);
    if (match) {
      // Extract parameters from match
      const params: Record<string, string> = {};
      route.params.forEach((paramName, index) => {
        // +1 because match[0] is the complete match
        const value = match[index + 1];
        params[paramName] = value !== undefined ? value : '';
      });
      
      return {
        route,
        params,
      };
    }
  }
  
  return null;
}

