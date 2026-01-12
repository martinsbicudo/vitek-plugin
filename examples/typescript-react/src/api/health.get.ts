/**
 * Health check endpoint
 * GET /api/health
 */

import type { VitekContext } from 'vitek-plugin';

export default function handler(_context: VitekContext) {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}

