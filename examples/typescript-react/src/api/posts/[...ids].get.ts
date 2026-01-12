/**
 * Get posts by IDs (catch-all route)
 * GET /api/posts/:ids...
 */

import type { VitekContext } from 'vitek-plugin';

export default async function handler(context: VitekContext) {
  const { params } = context;
  
  // In catch-all routes, the parameter contains the full path
  const ids = params.ids ? params.ids.split('/').filter(Boolean) : [];
  
  return {
    requestedIds: ids,
    posts: ids.map((id: string) => ({
      id,
      title: `Post ${id}`,
      content: `Content for post ${id}`,
    })),
  };
}

