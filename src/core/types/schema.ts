/**
 * Schema for type generation
 * Core logic - no dependencies
 */

import type { Route } from '../routing/route-types.js';

/**
 * Schema of a route for type generation
 */
export interface RouteSchema {
  pattern: string;
  method: string;
  params: string[];
  file: string;
  bodyType?: string;
  queryType?: string;
}

/**
 * Converts routes to schema
 */
export function routesToSchema(routes: Route[]): RouteSchema[] {
  return routes.map(route => ({
    pattern: route.pattern,
    method: route.method,
    params: route.params,
    file: route.file,
    bodyType: route.bodyType,
    queryType: route.queryType,
  }));
}

