/**
 * Create user
 * POST /api/users/:id
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
    message: 'User created',
    id: params.id,
    data: body,
    createdAt: new Date().toISOString(),
  };
}

