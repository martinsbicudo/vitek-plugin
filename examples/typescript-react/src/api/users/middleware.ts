/**
 * Middleware specific for user routes
 * This middleware is executed for all routes that start with /api/users/*
 * Examples: /api/users/:id, /api/users/:id/posts, /api/users/:id/settings, etc.
 */

import type { Middleware } from 'vitek-plugin';

export default [
  async (context, next) => {
    console.log(`[Users Middleware] Handling ${context.method.toUpperCase()} ${context.path}`);
    
    // Example: Authentication validation specific for user routes
    // You can check if the user is authenticated here
    
    // Example: Log access to sensitive data
    if (context.method === 'GET' && context.params && 'id' in context.params) {
      console.log(`[Users Middleware] Accessing user data for ID: ${context.params.id}`);
    }
    
    await next();
  },
  
  // Second middleware in the chain for users
  async (context, next) => {
    // Example: Rate limiting specific for user routes
    // (simplified implementation for demonstration)
    console.log(`[Users Middleware] Rate limit check for ${context.path}`);
    
    await next();
  },
] satisfies Middleware[];

