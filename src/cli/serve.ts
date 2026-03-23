/**
 * Production server (vitek-serve): serves static assets and the API from dist/
 * Usage: vitek-serve [--dir=dist] [--port=3000] [--host=0.0.0.0] [--mode=production|--env=...]
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
import { API_BASE_PATH, getSocketBasePath } from '../shared/constants.js';
import { getApiBundleFilename } from '../build/build-api-bundle.js';
import { getSocketsBundleFilename } from '../build/build-sockets-bundle.js';
import type { ApiClient, SocketEmitter, VitekApp } from '../core/shared/vitek-app.js';
import { isProduction } from '../shared/utils.js';

const VITEK_SERVE_CONFIG_FILENAME = 'vitek.config.mjs';

export type BeforeApiRequestHook = import('../core/server/request-handler.js').BeforeApiRequestHook;

export interface OnServerStartContext {
  api: ApiClient;
  sockets: SocketEmitter;
  server: http.Server;
}

export type OnServerStartHook = (ctx: OnServerStartContext) => void | Promise<void>;
export type OnServerShutdownHook = () => void | Promise<void>;

export interface ProductionConfig {
  beforeApiRequest?: BeforeApiRequestHook[];
  onError?: (err: Error, req: http.IncomingMessage, res: http.ServerResponse) => void | Promise<void>;
  onServerStart?: OnServerStartHook;
  onServerShutdown?: OnServerShutdownHook;
  maxBodySize?: number;
}

/** Load beforeApiRequest, onError, onServerStart, onServerShutdown from dist/vitek.config.mjs if present. Throws if file exists but import fails. */
export async function loadProductionConfig(distDir: string): Promise<ProductionConfig> {
  const configPath = path.join(distDir, VITEK_SERVE_CONFIG_FILENAME);
  if (!fs.existsSync(configPath)) return {};
  const configUrl = pathToFileURL(configPath).href;
  const configMod = await import(configUrl) as {
    beforeApiRequest?: BeforeApiRequestHook | BeforeApiRequestHook[];
    onError?: (err: Error, req: http.IncomingMessage, res: http.ServerResponse) => void | Promise<void>;
    onServerStart?: OnServerStartHook;
    onServerShutdown?: OnServerShutdownHook;
    maxBodySize?: number;
  };
  const result: ProductionConfig = {};
  if (configMod.beforeApiRequest) {
    result.beforeApiRequest = Array.isArray(configMod.beforeApiRequest) ? configMod.beforeApiRequest : [configMod.beforeApiRequest];
  }
  if (configMod.onError) result.onError = configMod.onError;
  if (configMod.onServerStart) result.onServerStart = configMod.onServerStart;
  if (configMod.onServerShutdown) result.onServerShutdown = configMod.onServerShutdown;
  if (configMod.maxBodySize != null) result.maxBodySize = configMod.maxBodySize;
  return result;
}

export function parseArgs(): {
  dir: string;
  port: number;
  host: string;
  cors: boolean;
  trustProxy: boolean;
  mode?: string;
} {
  let dir = 'dist';
  const portEnv = process.env.PORT;
  const hostEnv = process.env.HOST;
  let port = portEnv !== undefined && portEnv !== '' ? parseInt(portEnv, 10) : 3000;
  if (Number.isNaN(port)) port = 3000;
  let host = hostEnv !== undefined && hostEnv !== '' ? hostEnv : '0.0.0.0';
  let cors = false;
  let trustProxy = false;
  let mode: string | undefined;
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--dir=')) dir = arg.slice(6);
    else if (arg === '--dir' && argv[i + 1]) dir = argv[++i];
    else if (arg.startsWith('--port=')) port = parseInt(arg.slice(7), 10);
    else if (arg === '--port' && argv[i + 1]) port = parseInt(argv[++i], 10);
    else if (arg.startsWith('--host=')) host = arg.slice(7);
    else if (arg === '--host' && argv[i + 1]) host = argv[++i];
    else if (arg === '--cors') cors = true;
    else if (arg === '--trust-proxy') trustProxy = true;
    else if (arg.startsWith('--mode=')) mode = arg.slice(7);
    else if (arg === '--mode' && argv[i + 1]) mode = argv[++i];
    else if (arg.startsWith('--env=')) mode = arg.slice(6);
    else if (arg === '--env' && argv[i + 1]) mode = argv[++i];
  }
  return { dir, port, host, cors, trustProxy, mode };
}

export async function main(): Promise<void> {
  const { dir, port, host, cors, trustProxy, mode: modeArg } = parseArgs();
  const production = isProduction({ mode: modeArg, nodeEnv: process.env.NODE_ENV });
  const distDir = path.resolve(process.cwd(), dir);

  if (!fs.existsSync(distDir) || !fs.statSync(distDir).isDirectory()) {
    console.error(`[vitek-serve] Directory not found or not a directory: ${distDir}`);
    process.exit(1);
  }

  const apiBaseUrl = `http://127.0.0.1:${port}${API_BASE_PATH}`;
  const api: ApiClient = {
    async fetch(path: string, fetchOptions?: { method?: string; body?: unknown }) {
      const url = `${apiBaseUrl}/${path.replace(/^\//, '')}`;
      const res = await fetch(url, {
        method: fetchOptions?.method ?? 'GET',
        headers:
          fetchOptions?.body !== undefined
            ? { 'Content-Type': 'application/json' }
            : undefined,
        body:
          fetchOptions?.body !== undefined
            ? JSON.stringify(fetchOptions.body)
            : undefined,
      });
      const text = await res.text();
      if (!text) return undefined;
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    },
  };
  const noopSockets: SocketEmitter = { emit() {} };
  const shared: VitekApp = { sockets: noopSockets, api };

  const app = connect();

  const bundlePath = path.join(distDir, getApiBundleFilename());
  let productionConfig: Awaited<ReturnType<typeof loadProductionConfig>> = {};
  try {
    productionConfig = await loadProductionConfig(distDir);
  } catch (err) {
    console.warn('[vitek-serve] Failed to load vitek.config.mjs; continuing without production hooks:', err instanceof Error ? err.message : String(err));
  }
  const { beforeApiRequest, onError, onServerStart, onServerShutdown, maxBodySize } = productionConfig;

  if (fs.existsSync(bundlePath)) {
    try {
      const bundleUrl = pathToFileURL(bundlePath).href;
      const mod = await import(bundleUrl) as { routes: unknown[]; middlewares: unknown[] };
      const apiHandler = createRequestHandler({
        routes: mod.routes as Parameters<typeof createRequestHandler>[0]['routes'],
        middlewares: mod.middlewares as Parameters<typeof createRequestHandler>[0]['middlewares'],
        beforeApiRequest,
        cors: cors ? true : undefined,
        trustProxy,
        maxBodySize,
        onError,
        shared,
        production,
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

  const socketBasePath = getSocketBasePath();
  const socketsBundlePath = path.join(distDir, getSocketsBundleFilename());
  if (fs.existsSync(socketsBundlePath)) {
    try {
      const socketsUrl = pathToFileURL(socketsBundlePath).href;
      const mod = await import(socketsUrl) as { sockets: Parameters<typeof createSocketHandler>[0]['sockets'] };
      const handler = createSocketHandler({
        sockets: mod.sockets,
        socketBasePath,
        shared,
      });
      server.on('upgrade', handler);
    } catch (err) {
      console.warn('[vitek-serve] Failed to load sockets bundle:', err instanceof Error ? err.message : String(err));
    }
  }

  if (onServerStart) {
    try {
      await Promise.resolve(onServerStart({ api: shared.api, sockets: shared.sockets, server }));
    } catch (err) {
      console.error('[vitek-serve] onServerStart failed:', err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  }

  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    if (onServerShutdown) {
      try {
        await Promise.resolve(onServerShutdown());
      } catch (err) {
        console.warn('[vitek-serve] onServerShutdown error:', err instanceof Error ? err.message : String(err));
      }
    }
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  server.listen(port, host, () => {
    const base = `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`;
    const hint = modeArg != null && modeArg !== '' ? `--mode ${modeArg}` : `NODE_ENV=${process.env.NODE_ENV ?? ''}`;
    console.log(`[vitek-serve] Ready at ${base} (${production ? 'production' : 'development'}; ${hint})`);
  });
}

const isServeEntry = process.argv[1]?.endsWith('serve.js');
if (typeof process.env.VITEST === 'undefined' && isServeEntry) {
  main().catch((err) => {
    console.error('[vitek-serve]', err);
    process.exit(1);
  });
}
