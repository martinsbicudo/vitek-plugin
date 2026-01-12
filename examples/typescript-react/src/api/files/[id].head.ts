/**
 * Check if file exists (HEAD request)
 * HEAD /api/files/:id
 * 
 * HEAD is used to check if a resource exists without returning the body
 */

import type { VitekContext } from 'vitek-plugin';

export default async function handler(context: VitekContext) {
  const { params } = context;
  
  // Simulates file verification
  const fileExists = parseInt(params.id) % 2 === 0;
  
  // HEAD requests usually don't return body, but our system allows it
  // In a real case, you would configure only headers
  return {
    exists: fileExists,
    fileId: params.id,
  };
}

