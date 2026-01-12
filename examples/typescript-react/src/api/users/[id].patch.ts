/**
 * Update user (partial update)
 * PATCH /api/users/:id
 */

import type { VitekContext } from 'vitek-plugin';

export type Body = {
  name?: string;
  email?: string;
  age?: number;
};

export default async function handler(context: VitekContext) {
  const { params, body } = context;
  
  return {
    message: 'User updated (partial)',
    id: params.id,
    updates: body,
    updatedAt: new Date().toISOString(),
  };
}

