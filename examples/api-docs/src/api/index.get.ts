/**
 * API root
 * @summary API root
 * @description Root endpoint of the API
 * @tag General
 * @response 200 {object} - API information
 */
import type { VitekContext } from 'vitek-plugin';

export default function handler(_context: VitekContext) {
  return {
    message: 'API root',
    docs: '/api-docs.html',
    openapi: '/openapi.json',
  };
}
