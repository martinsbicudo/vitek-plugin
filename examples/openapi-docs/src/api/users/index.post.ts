/**
 * Create User
 * 
 * Creates a new user account with the provided information.
 * Email must be unique. Returns the created user with generated ID.
 * 
 * @summary Create new user
 * @description Creates a new user account. 
 *              The email address must be unique across the system.
 * @tag Users
 * @bodyDescription User creation data (name, email, role)
 * @response 201 {object} - User created successfully
 * @response 400 - Invalid request body
 * @response 409 - Email already exists
 * @response 500 - Internal server error
 * 
 * POST /api/users
 */

import type { VitekContext } from 'vitek-plugin';

export type Body = {
  /** User's full name */
  name: string;
  /** User's email address (must be unique) */
  email: string;
  /** User role - defaults to 'user' */
  role?: 'admin' | 'user' | 'guest';
  /** Optional bio/description */
  bio?: string;
};

export default async function handler(context: VitekContext) {
  const { body } = context;
  
  // Simulate user creation
  const newUser = {
    id: Math.floor(Math.random() * 10000) + 1,
    name: body.name,
    email: body.email,
    role: body.role || 'user',
    bio: body.bio || null,
    createdAt: new Date().toISOString(),
  };
  
  return {
    status: 201,
    message: 'User created successfully',
    user: newUser,
  };
}
