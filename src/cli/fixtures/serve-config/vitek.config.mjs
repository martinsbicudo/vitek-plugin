/** Fixture for serve.test.ts: config that exports beforeApiRequest, onError, onServerStart, onServerShutdown */
export function beforeApiRequest(_ctx, next) {
  next();
}

export function onError(_err, _req, res) {
  res.statusCode = 503;
  res.end('Unavailable');
}

export function onServerStart(ctx) {
  if (typeof globalThis !== 'undefined') {
    globalThis.__vitekOnServerStartCtx = ctx;
    globalThis.__vitekOnServerStartCalled = true;
  }
}

export function onServerShutdown() {
  if (typeof globalThis !== 'undefined') {
    globalThis.__vitekOnServerShutdownCalled = true;
  }
}
