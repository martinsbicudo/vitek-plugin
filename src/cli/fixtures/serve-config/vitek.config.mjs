/** Fixture for serve.test.ts: config that exports beforeApiRequest */
export function beforeApiRequest(_ctx, next) {
  next();
}

export function onError(_err, _req, res) {
  res.statusCode = 503;
  res.end('Unavailable');
}
