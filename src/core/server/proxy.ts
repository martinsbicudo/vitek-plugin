/**
 * Proxy (X-Forwarded-*) helpers for the request handler
 */

import type { IncomingMessage } from 'http';

export interface EffectiveRequest {
  /** Effective URL (derived from X-Forwarded-* when trustProxy is true). */
  url: string;
  /** Client IP (X-Forwarded-For or socket.remoteAddress). */
  clientIp?: string;
}

/**
 * Derives effective URL and client IP from request when behind a reverse proxy.
 * When trustProxy is false, returns the request url as-is and no clientIp.
 */
export function getEffectiveRequest(
  req: IncomingMessage,
  trustProxy: boolean
): EffectiveRequest {
  if (!trustProxy) {
    return { url: req.url ?? '' };
  }
  const proto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim() || 'http';
  const host = (req.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim() || req.headers.host || 'localhost';
  const path = req.url?.split('?')[0] ?? '/';
  const query = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const effectiveUrl = `${proto}://${host}${path}${query}`;
  const forwardedFor = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim();
  const clientIp = forwardedFor || (req.socket?.remoteAddress);
  return { url: effectiveUrl, clientIp };
}
