/**
 * Delete user
 * DELETE /api/users/:id
 */

import type { VitekContext } from 'vitek-plugin';

export default async function handler(context: VitekContext) {
  const { params } = context;
  
  return {
    message: 'User deleted',
    id: params.id,
    deletedAt: new Date().toISOString(),
  };
}

