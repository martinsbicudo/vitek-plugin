/**
 * Middleware composer (Koa-style)
 * Core logic - no dependencies
 */

import type { Middleware } from '../routing/route-types.js';
import type { VitekContext } from '../context/create-context.js';

/**
 * Composes middlewares into a single function
 * Executes in order and allows each middleware to call next() to continue
 */
export function compose(middlewares: Middleware[]) {
  return async function (context: VitekContext, handler: () => Promise<any>): Promise<any> {
    let index = -1;
    
    async function dispatch(i: number): Promise<void> {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      
      index = i;
      
      // If all middlewares have been executed, call the final handler
      if (i === middlewares.length) {
        return handler();
      }
      
      const middleware = middlewares[i];
      
      // Execute the current middleware
      await middleware(context, () => dispatch(i + 1));
    }
    
    return dispatch(0);
  };
}

