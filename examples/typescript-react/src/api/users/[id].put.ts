/**
 * Update user (full update)
 * PUT /api/users/:id
 */

import type { VitekContext } from 'vitek-plugin';

export type Body = {
  name: string;
  email: string;
  age?: number;
};

export default async function handler(context: VitekContext) {
  const { params, body } = context;
  
  return {
    message: 'User updated (full)',
    id: params.id,
    data: body,
    updatedAt: new Date().toISOString(),
  };
}

