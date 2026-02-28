/**
 * Get user by ID
 * GET /api/users/:id
 * Uses relative import (../../lib/utils)
 */

import type { VitekContext } from 'vitek-plugin';
import { formatTimestamp } from '../../lib/utils';

export default async function handler(context: VitekContext) {
  const { params } = context;
  
  return {
    id: params.id,
    name: `User ${params.id}`,
    email: `user${params.id}@example.com`,
    createdAt: formatTimestamp(),
  };
}

