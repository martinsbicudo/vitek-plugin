/**
 * Health check endpoint
 * GET /api/health
 * Uses relative import (../lib/utils)
 */

import type { VitekContext } from 'vitek-plugin';
import { getAppVersion, formatTimestamp } from '../lib/utils';

export default function handler(_context: VitekContext) {
  return {
    status: 'ok',
    version: getAppVersion(),
    timestamp: formatTimestamp(),
    uptime: process.uptime(),
  };
}

