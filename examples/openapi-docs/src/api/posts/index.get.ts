/**
 * List Posts
 * 
 * Retrieves a paginated list of blog posts.
 * Supports filtering by search term and sorting.
 * 
 * @summary List all posts
 * @description Returns a paginated list of posts.
 *              Use query parameters to filter and sort results.
 * @tag Posts
 * @response 200 {object} - List of posts with pagination
 * @response 500 - Internal server error
 * 
 * GET /api/posts
 */

import type { VitekContext } from 'vitek-plugin';

export type Query = {
  /** Page number (1-based) */
  page?: number;
  /** Number of items per page (max 100) */
  limit?: number;
  /** Search term for title/content */
  search?: string;
  /** Sort field */
  sortBy?: 'createdAt' | 'title' | 'views';
  /** Sort order */
  order?: 'asc' | 'desc';
};

// Mock data
const mockPosts = [
  { id: 1, title: 'Getting Started with Vitek', content: 'Vitek is...', author: 'Alice', views: 1250, createdAt: '2024-01-10' },
  { id: 2, title: 'OpenAPI Best Practices', content: 'When documenting...', author: 'Bob', views: 890, createdAt: '2024-01-12' },
  { id: 3, title: 'TypeScript Tips', content: 'Here are some...', author: 'Charlie', views: 2100, createdAt: '2024-01-15' },
];

export default async function handler(context: VitekContext) {
  const { query } = context;
  
  const page = query.page || 1;
  const limit = Math.min(query.limit || 10, 100);
  const sortBy = query.sortBy || 'createdAt';
  const order = query.order || 'desc';
  
  // Apply search filter if provided
  let posts = [...mockPosts];
  if (query.search) {
    const search = (query.search as string).toLowerCase();
    posts = posts.filter(p => 
      p.title.toLowerCase().includes(search) || 
      p.content.toLowerCase().includes(search)
    );
  }
  
  // Sort
  posts.sort((a: any, b: any) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return order === 'asc' 
      ? aVal > bVal ? 1 : -1 
      : aVal < bVal ? 1 : -1;
  });
  
  // Paginate
  const start = (page - 1) * limit;
  const paginatedPosts = posts.slice(start, start + limit);
  
  return {
    posts: paginatedPosts,
    pagination: {
      page,
      limit,
      total: posts.length,
      totalPages: Math.ceil(posts.length / limit),
    },
  };
}
