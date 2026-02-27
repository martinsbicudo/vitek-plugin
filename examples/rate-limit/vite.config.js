import { defineConfig } from 'vite';
import { vitek } from 'vitek-plugin';

const windowMs = 60_000;
const maxPerWindow = 10;
const store = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = typeof forwarded === 'string' ? forwarded : forwarded[0];
    return first.split(',')[0].trim();
  }
  return req.socket?.remoteAddress ?? 'unknown';
}

export const rateLimitPlugin = {
  name: 'rate-limit',
  beforeApiRequest({ req, res, path, next }) {
    const ip = getClientIp(req);
    const now = Date.now();
    let entry = store.get(ip);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(ip, entry);
    }
    entry.count++;
    if (entry.count > maxPerWindow) {
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Too many requests' }));
      return;
    }
    next();
  },
};

export default defineConfig({
  plugins: [vitek({ plugins: [rateLimitPlugin] })],
});
