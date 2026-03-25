export function beforeApiRequest(ctx, next) {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[reliable-api] ${ctx.method} ${ctx.path}`);
  }
  next();
}

export function onError(err, req, res) {
  if (res.writableEnded) return;
  console.error('[reliable-api] onError:', err.message);
  res.statusCode = 500;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'production_on_error', message: err.message }));
}
