/**
 * API Version endpoint (no params, no query, no body - only options)
 * GET /api/version
 */

import type { VitekContext } from 'vitek-plugin';

export default function handler(_context: VitekContext) {
  return {
    version: '1.0.0',
    api: 'vitek',
    timestamp: new Date().toISOString(),
  };
}

