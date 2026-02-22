/**
 * Production server (vitek-serve): serves static assets and the API from dist/
 * Usage: vitek-serve [--dir=dist] [--port=3000] [--host=0.0.0.0]
 *        Also accepts space-separated: --dir dist --port 3000 --host 0.0.0.0
 */

import * as http from 'http';
import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';
import connect from 'connect';
import serveStatic from 'serve-static';
import { createRequestHandler } from '../core/server/request-handler.js';
import { createSocketHandler } from '../core/socket/socket-handler.js';
import { API_BASE_PATH } from '../shared/constants.js';
import { getApiBundleFilename } from '../build/build-api-bundle.js';
import { getSocketsBundleFilename } from '../build/build-sockets-bundle.js';

function parseArgs(): { dir: string; port: number; host: string } {
  let dir = 'dist';
  let port = 3000;
  let host = '0.0.0.0';
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--dir=')) dir = arg.slice(6);
    else if (arg === '--dir' && argv[i + 1]) dir = argv[++i];
    else if (arg.startsWith('--port=')) port = parseInt(arg.slice(7), 10);
    else if (arg === '--port' && argv[i + 1]) port = parseInt(argv[++i], 10);
    else if (arg.startsWith('--host=')) host = arg.slice(7);
    else if (arg === '--host' && argv[i + 1]) host = argv[++i];
  }
  return { dir, port, host };
}

async function main(): Promise<void> {
  const { dir, port, host } = parseArgs();
  const distDir = path.resolve(process.cwd(), dir);

  if (!fs.existsSync(distDir) || !fs.statSync(distDir).isDirectory()) {
    console.error(`[vitek-serve] Directory not found or not a directory: ${distDir}`);
    process.exit(1);
  }

  const app = connect();

  const bundlePath = path.join(distDir, getApiBundleFilename());
  if (fs.existsSync(bundlePath)) {
    try {
      const bundleUrl = pathToFileURL(bundlePath).href;
      const mod = await import(bundleUrl) as { routes: unknown[]; middlewares: unknown[] };
      const apiHandler = createRequestHandler({
        routes: mod.routes as Parameters<typeof createRequestHandler>[0]['routes'],
        middlewares: mod.middlewares as Parameters<typeof createRequestHandler>[0]['middlewares'],
      });
      app.use(apiHandler as (req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => void);
    } catch (err) {
      console.warn('[vitek-serve] Failed to load API bundle; serving static files only:', err instanceof Error ? err.message : String(err));
    }
  } else {
    console.log('[vitek-serve] No API bundle found; serving static files only.');
  }

  app.use(serveStatic(distDir, { fallthrough: true }));

  app.use((req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.url?.startsWith(API_BASE_PATH)) return next();
    const indexHtml = path.join(distDir, 'index.html');
    if (!fs.existsSync(indexHtml)) return next();
    res.setHeader('Content-Type', 'text/html');
    fs.createReadStream(indexHtml).pipe(res);
  });

  const server = http.createServer(app);

  const socketsBundlePath = path.join(distDir, getSocketsBundleFilename());
  if (fs.existsSync(socketsBundlePath)) {
    try {
      const socketsUrl = pathToFileURL(socketsBundlePath).href;
      const mod = await import(socketsUrl) as { sockets: Parameters<typeof createSocketHandler>[0]['sockets'] };
      const handler = createSocketHandler({ sockets: mod.sockets });
      server.on('upgrade', handler);
    } catch (err) {
      console.warn('[vitek-serve] Failed to load sockets bundle:', err instanceof Error ? err.message : String(err));
    }
  }

  server.listen(port, host, () => {
    const base = `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`;
    console.log(`[vitek-serve] Ready at ${base}`);
  });
}

main().catch((err) => {
  console.error('[vitek-serve]', err);
  process.exit(1);
});
