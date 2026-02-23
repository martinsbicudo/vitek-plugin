/**
 * Health Check
 * 
 * Simple endpoint to verify the API is running.
 * 
 * @summary Health check
 * @description Returns the current API status and timestamp
 * @tag System
 * @response 200 {object} - API is healthy
 * 
 * GET /api/health
 */

import type { VitekContext } from 'vitek-plugin';

export default function handler(_context: VitekContext) {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'vitek-api-docs-example',
  };
}
