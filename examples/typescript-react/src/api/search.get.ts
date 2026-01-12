/**
 * Search endpoint (query only)
 * GET /api/search
 */

import type { VitekContext } from 'vitek-plugin';

export type Query = {
  q: string;
  limit?: number;
  offset?: number;
  sort?: 'asc' | 'desc';
};

export default async function handler(context: VitekContext) {
  const { query } = context;
  
  return {
    query: query.q,
    limit: query.limit || 10,
    offset: query.offset || 0,
    sort: query.sort || 'asc',
    results: [
      { id: 1, title: `Result for "${query.q}"` },
      { id: 2, title: `Another result for "${query.q}"` },
    ],
  };
}

