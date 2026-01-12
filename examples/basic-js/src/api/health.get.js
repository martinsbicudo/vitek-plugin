/**
 * Health check endpoint
 * GET /api/health
 */

export default function handler(context) {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
