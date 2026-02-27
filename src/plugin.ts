/**
 * Main Vite plugin
 * Thin layer that registers the plugin and connects with adapters
 */

import type { Plugin } from 'vite';
import * as path from 'path';
import * as fs from 'fs';
import MagicString from 'magic-string';
import { pathToFileURL, fileURLToPath } from 'url';
import { createViteDevServerMiddleware } from './adapters/vite/dev-server.js';
import { createViteLogger } from './adapters/vite/logger.js';
import { createRequestHandler } from './core/server/request-handler.js';
import { buildApiBundle, getApiBundleFilename } from './build/build-api-bundle.js';
import { scanApiDirectory } from './core/file-system/scan-api-dir.js';
import { parsedRoutesToSchema, runFileGeneration } from './core/generation/run-file-generation.js';
import { buildSocketsBundle, getSocketsBundleFilename } from './build/build-sockets-bundle.js';
import { createSocketHandler } from './core/socket/socket-handler.js';
import { API_BASE_PATH, API_DIR_NAME, getSocketBasePath } from './shared/constants.js';
import type { RequestHandlerOptions } from './core/server/request-handler.js';
import type { OpenApiOptions } from './core/openapi/generate.js';
import type { ApiClient, SocketEmitter, VitekApp } from './core/shared/vitek-app.js';

export interface VitekOptions {
  /** API directory (relative to root) */
  apiDir?: string;
  /** API base path (default: /api) */
  apiBasePath?: string;
  /** Build API bundle for preview/production (default: true). Set to false to skip. */
  buildApi?: boolean;
  /** Enable request validation (default: false) */
  enableValidation?: boolean;
  /** Logging configuration */
  logging?: {
    /** Log level: 'debug' | 'info' | 'warn' | 'error' (default: 'info') */
    level?: 'debug' | 'info' | 'warn' | 'error';
    /** Enable request/response logging (default: false) */
    enableRequestLogging?: boolean;
    /** Enable route matching logs (default: true) */
    enableRouteLogging?: boolean;
  };
  /** Enable OpenAPI/Swagger documentation generation */
  openApi?: OpenApiOptions | boolean;
  /** Enable WebSocket sockets (default: true). Set to false to disable, or { path: '/ws' } to customize base path. */
  sockets?: boolean | { path?: string };
  /** Callback when types/services/OpenAPI generation fails. Receives the error. */
  onGenerationError?: (error: Error) => void;
}

/**
 * Vite plugin for Vitek
 */
export function vitek(options: VitekOptions = {}): Plugin {
  const apiDirOption = options.apiDir || `src/${API_DIR_NAME}`;
  const buildApi = options.buildApi !== false;
  let root: string;
  let buildOutDir: string;
  let cleanupFn: (() => void) | null = null;

  return {
    name: 'vitek',
    enforce: 'pre',

    configResolved(config) {
      root = config.root;
      buildOutDir = path.resolve(root, config.build?.outDir ?? 'dist');
    },

    async buildStart() {
      if (!buildApi) return;
      const fullApiDir = path.resolve(root, apiDirOption);
      if (!fs.existsSync(fullApiDir)) return;

      const scanResult = scanApiDirectory(fullApiDir);
      if (scanResult.routes.length === 0 && scanResult.sockets.length === 0) return;

      const schema = parsedRoutesToSchema(scanResult.routes);
      const socketBasePath = getSocketBasePath(
        options.apiBasePath,
        typeof options.sockets === 'object' ? options.sockets?.path : undefined
      );

      try {
        await runFileGeneration({
          root,
          schema,
          sockets: scanResult.sockets,
          apiBasePath: options.apiBasePath ?? API_BASE_PATH,
          socketBasePath,
          openApi: options.openApi,
          serverPort: 5173,
          onGenerationError: options.onGenerationError,
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('[vitek] Failed to generate types/services:', error.message);
        options.onGenerationError?.(error);
      }
    },

    resolveId(id, importer) {
      if (!id.startsWith('.') || !importer) return null;
      const fullApiDir = path.resolve(root, apiDirOption);
      let importerPath: string;
      if (importer.startsWith('file:')) {
        importerPath = fileURLToPath(importer);
      } else if (importer.startsWith('/')) {
        const virtualPath = path.join(root, importer.replace(/^\//, ''));
        importerPath = fs.existsSync(virtualPath) ? virtualPath : path.resolve(importer);
      } else {
        importerPath = path.resolve(importer);
      }
      const normalizedApiDir = path.resolve(fullApiDir);
      const normalizedImporter = path.resolve(importerPath);
      if (!normalizedImporter.startsWith(normalizedApiDir)) return null;
      let resolved = path.resolve(path.dirname(normalizedImporter), id);
      if (!fs.existsSync(resolved)) {
        const ext = ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs'].find((e) =>
          fs.existsSync(resolved + e)
        );
        if (ext) resolved += ext;
      }
      return fs.existsSync(resolved) ? pathToFileURL(resolved).href : null;
    },

    transform(code, id) {
      if (id.includes('node_modules') || !/\.(tsx?|jsx?|mjs)$/.test(id)) return null;
      const idPath = id.startsWith('file:') ? fileURLToPath(id) : id;
      const srcDir = path.resolve(root, 'src');
      const virtualCandidate = idPath.startsWith('/') ? path.join(root, idPath.replace(/^\//, '')) : null;
      const normalizedId = virtualCandidate != null && fs.existsSync(virtualCandidate)
        ? virtualCandidate
        : path.resolve(idPath);
      if (!normalizedId.startsWith(srcDir)) return null;
      const dir = path.dirname(normalizedId);
      const rootSlash = path.resolve(root) + path.sep;
      const relImportRe = /from\s+['"](\.\.?[^'"]+)['"]/g;
      let match: RegExpExecArray | null;
      const s = new MagicString(code);
      let hasChanges = false;
      while ((match = relImportRe.exec(code)) !== null) {
        const specifier = match[1];
        const resolved = path.resolve(dir, specifier);
        if (!resolved.startsWith(rootSlash)) continue;
        let target = resolved;
        if (!fs.existsSync(target)) {
          const ext = ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs'].find((e) =>
            fs.existsSync(target + e)
          );
          if (ext) target += ext;
        }
        if (!fs.existsSync(target)) continue;
        const rootRelative = path.relative(root, target).replace(/\\/g, '/');
        const newSpecifier = `/${rootRelative}`;
        const quote = match[0].includes('"') ? '"' : "'";
        s.overwrite(match.index, match.index + match[0].length, `from ${quote}${newSpecifier}${quote}`);
        hasChanges = true;
      }
      if (!hasChanges) return null;
      return {
        code: s.toString(),
        map: s.generateMap({ hires: 'boundary' }),
      };
    },

    async configureServer(server) {
      const fullApiDir = path.resolve(root, apiDirOption);

      if (!fs.existsSync(fullApiDir)) {
        server.config.logger.warn(
          `[vitek] API directory not found: ${fullApiDir}`
        );
        return;
      }

      const logger = createViteLogger(server.config.logger, options.logging);
      const socketsEnabled = options.sockets !== false;
      const socketBasePath = getSocketBasePath(
        options.apiBasePath,
        typeof options.sockets === 'object' ? options.sockets?.path : undefined
      );
      const { ready, middleware, cleanup, setupSockets } = createViteDevServerMiddleware({
        root,
        apiDir: fullApiDir,
        logger,
        viteServer: server,
        enableValidation: options.enableValidation || false,
        openApi: options.openApi,
        sockets: socketsEnabled,
        socketBasePath,
        onGenerationError: options.onGenerationError,
      });

      cleanupFn = cleanup;

      server.middlewares.use(middleware);

      await ready;

      if (socketsEnabled && server.httpServer) {
        setupSockets(server.httpServer);
      }

      logger.info('Vitek plugin initialized');

      const port = server.config.server?.port ?? 5173;
      const apiPath = options.apiBasePath ?? API_BASE_PATH;
      const originalPrintUrls = server.printUrls?.bind(server);
      if (typeof originalPrintUrls === 'function') {
        server.printUrls = () => {
          originalPrintUrls();
          const host = 'localhost';
          const apiUrl = `http://${host}:${port}${apiPath}`;
          server.config.logger.info(`  ➜  API:     ${apiUrl}`);
          if (socketsEnabled) {
            const wsUrl = `ws://${host}:${port}${socketBasePath}`;
            server.config.logger.info(`  ➜  WS:      ${wsUrl}`);
          }
        };
      }
    },

    async configurePreviewServer(server) {
      if (!buildApi) {
        return;
      }
      const bundlePath = path.join(buildOutDir, getApiBundleFilename());
      if (!fs.existsSync(bundlePath)) {
        server.config.logger.warn(
          '[vitek] API bundle not found; preview serving static assets only. Run `vite build` first.'
        );
        return;
      }

      const previewPort = server.config.preview?.port ?? 4173;
      const apiBaseUrl = `http://127.0.0.1:${previewPort}${API_BASE_PATH}`;
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

      const bundleUrl = pathToFileURL(bundlePath).href;
      const bundleLoadPromise = import(bundleUrl) as Promise<{
        routes: RequestHandlerOptions['routes'];
        middlewares: RequestHandlerOptions['middlewares'];
      }>;

      let apiHandler: ReturnType<typeof createRequestHandler> | null = null;

      const apiMiddleware = (req: import('http').IncomingMessage, res: import('http').ServerResponse, next: () => void) => {
        const pathname = req.url?.split('?')[0] ?? '';
        if (pathname !== API_BASE_PATH && !pathname.startsWith(API_BASE_PATH + '/')) {
          return next();
        }
        bundleLoadPromise
          .then((mod) => {
            if (!apiHandler) {
              apiHandler = createRequestHandler({
                routes: mod.routes,
                middlewares: mod.middlewares,
                shared,
              });
              server.config.logger.info('[vitek] API middleware registered for preview');
            }
            apiHandler(req, res, next);
          })
          .catch((err) => {
            server.config.logger.error(
              `[vitek] Failed to load API bundle: ${err instanceof Error ? err.message : String(err)}`
            );
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error', message: 'Failed to load API bundle' }));
          });
      };

      server.middlewares.use(apiMiddleware);

      const socketsEnabled = options.sockets !== false;
      const socketBasePath = getSocketBasePath(
        options.apiBasePath,
        typeof options.sockets === 'object' ? options.sockets?.path : undefined
      );
      const socketsBundlePath = path.join(buildOutDir, getSocketsBundleFilename());
      if (socketsEnabled && fs.existsSync(socketsBundlePath)) {
        try {
          const socketsUrl = pathToFileURL(socketsBundlePath).href;
          const mod = await import(socketsUrl) as { sockets: Parameters<typeof createSocketHandler>[0]['sockets'] };
          const handler = createSocketHandler({
            sockets: mod.sockets,
            socketBasePath,
            shared,
          });
          server.httpServer?.on('upgrade', handler);
          server.config.logger.info('[vitek] WebSocket sockets registered for preview');
        } catch (err) {
          server.config.logger.warn(
            `[vitek] Failed to load sockets bundle: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    },

    async closeBundle() {
      if (buildApi) {
        const fullApiDir = path.resolve(root, apiDirOption);
        try {
          await buildApiBundle({
            root,
            apiDir: fullApiDir,
            outDir: buildOutDir,
          });
        } catch (err) {
          console.error('[vitek] Failed to build API bundle:', err instanceof Error ? err.message : err);
        }
        const socketsEnabled = options.sockets !== false;
        if (socketsEnabled && fs.existsSync(fullApiDir)) {
          try {
            await buildSocketsBundle({
              root,
              apiDir: fullApiDir,
              outDir: buildOutDir,
            });
          } catch (err) {
            console.error('[vitek] Failed to build sockets bundle:', err instanceof Error ? err.message : err);
          }
        }
      }
    },

    buildEnd() {
      if (cleanupFn) {
        cleanupFn();
        cleanupFn = null;
      }
    },
  };
}

