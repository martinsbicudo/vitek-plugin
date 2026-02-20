/**
 * Get user by ID
 * 
 * Retrieves detailed information about a specific user.
 * 
 * @summary Get user details
 * @description Fetches a user by their unique identifier. Returns 404 if user not found.
 * @tag Users
 * @param id - The unique identifier of the user
 * @response 200 {object} - User found successfully
 * @response 404 - User not found
 * @response 500 - Internal server error
 * 
 * GET /api/users/:id
 */

import type { VitekContext } from 'vitek-plugin';

export interface Params {
  id: string;
}

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
