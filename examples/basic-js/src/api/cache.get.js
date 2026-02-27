/**
 * Cached response example: uses cacheControl helper for Cache-Control header.
 * GET /api/cache
 */
import { ok, cacheControl } from 'vitek-plugin';

export default function handler() {
  const body = { cached: true, at: new Date().toISOString() };
  return { ...ok(body), headers: { ...ok(body).headers, ...cacheControl(60) } };
}
