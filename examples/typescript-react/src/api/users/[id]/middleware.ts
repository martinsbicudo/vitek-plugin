/**
 * Middleware specific for individual user routes (with ID)
 * This middleware is executed only for routes that start with /api/users/:id/*
 * Examples: /api/users/:id/posts, /api/users/:id/settings, but NOT /api/users (list of users)
 * 
 * Note: This middleware will be executed AFTER the users middleware (users/middleware.ts)
 */

import type { Middleware } from 'vitek-plugin';

export default [
  async (context, next) => {
    console.log(`[Users/:id Middleware] Handling ${context.method.toUpperCase()} ${context.path}`);
    
    // Example: Specific validation for accessing a user's data
    if (context.params && 'id' in context.params) {
      const userId = context.params.id;
      console.log(`[Users/:id Middleware] Accessing data for user ID: ${userId}`);
      
      // Example: Check if the authenticated user has permission to access this user
      // (simplified implementation for demonstration)
      // In production, you would do something like:
      // if (context.user.id !== userId && !context.user.isAdmin) {
      //   throw new Error('Unauthorized');
      // }
    }
    
    await next();
  },
] satisfies Middleware[];

