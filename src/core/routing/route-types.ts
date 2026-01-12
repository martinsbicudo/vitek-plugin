/**
 * Route-related types
 * Core types - no dependencies
 */

import type { HttpMethod } from '../../shared/constants.js';
import type { VitekContext } from '../context/create-context.js';

/**
 * Route handler
 */
export type RouteHandler = (context: VitekContext) => Promise<any> | any;

/**
 * Middleware function
 */
export type Middleware = (
  context: VitekContext,
  next: () => Promise<void>
) => Promise<void> | void;

/**
 * Definition of a registered route
 */
export interface Route {
  /** Path pattern (ex: "users/:id") */
  pattern: string;
  /** HTTP method */
  method: HttpMethod;
  /** Route handler */
  handler: RouteHandler;
  /** Path parameters (ex: ["id"]) */
  params: string[];
  /** Source file (for debugging) */
  file: string;
  /** Regex for matching */
  regex: RegExp;
  /** Body type (name of the type exported from the file, ex: "Body") */
  bodyType?: string;
  /** Query type (name of the type exported from the file, ex: "Query") */
  queryType?: string;
}

/**
 * Route matching result
 */
export interface RouteMatch {
  route: Route;
  params: Record<string, string>;
}

