/**
 * Get user by ID
 * GET /api/users/:id
 */

import type { VitekContext } from 'vitek-plugin';

export default async function handler(context: VitekContext) {
  const { params } = context;
  
  // Simula busca de usuário
  return {
    id: params.id,
    name: `User ${params.id}`,
    email: `user${params.id}@example.com`,
    createdAt: new Date().toISOString(),
  };
}

