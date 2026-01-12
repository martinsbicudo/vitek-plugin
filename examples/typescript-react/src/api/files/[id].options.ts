/**
 * CORS preflight for file resource (OPTIONS with params)
 * OPTIONS /api/files/:id
 * 
 * OPTIONS with parameters for specific resources
 */

import type { VitekContext } from 'vitek-plugin';

export type Query = {
  origin?: string;
  method?: string;
};

export default async function handler(context: VitekContext) {
  const { params, query } = context;
  
  return {
    resourceId: params.id,
    allowedMethods: ['GET', 'HEAD', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'If-Match'],
    origin: query.origin || '*',
    requestedMethod: query.method || 'unknown',
    message: `CORS preflight for file ${params.id}`,
  };
}

