/**
 * CORS preflight handler (OPTIONS request)
 * OPTIONS /api/cors
 * 
 * OPTIONS is used for CORS preflight requests
 */

import type { VitekContext } from 'vitek-plugin';

export type Query = {
  origin?: string;
};

export default async function handler(context: VitekContext) {
  const { query } = context;
  
  // In a real case, you would configure CORS headers in the response
  // Here we just return information about allowed methods
  return {
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    origin: query.origin || '*',
    message: 'CORS preflight response',
  };
}

