/**
 * Get User by ID
 * 
 * Retrieves detailed information about a specific user.
 * Returns 404 if the user does not exist.
 * 
 * @summary Get user details
 * @description Fetches a user by their unique identifier. 
 *              Includes profile information and metadata.
 * @tag Users
 * @param id - The unique identifier of the user (numeric string)
 * @response 200 {object} - User found successfully
 * @response 400 - Invalid user ID format
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
  
  // Simulate user lookup
  const userId = parseInt(params.id, 10);
  
  if (isNaN(userId)) {
    return {
      status: 400,
      error: 'Invalid user ID format',
    };
  }
  
  // Mock user data
  return {
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
    role: userId === 1 ? 'admin' : 'user',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: new Date().toISOString(),
  };
}
