/**
 * Production config for vitek-serve: beforeApiRequest and onError hooks.
 * This file must be copied to dist/ during build (see package.json "build" script).
 */

/**
 * @param {object} ctx - { req, res, path, method }
 * @param {() => void} next - Call to continue to the API handler
 */
export function beforeApiRequest(ctx, next) {
  // e.g. logging, auth
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[vitek] ${ctx.method} ${ctx.path}`);
  }
  next();
}

/**
 * @param {Error} err
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export function onError(err, req, res) {
  console.error('[vitek] Error:', err.message);
  res.statusCode = 503;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Service Unavailable' }));
}
