/**
 * vitek:build — buildStart, closeBundle, buildEnd, configResolved
 */

import type { Plugin } from 'vite';
import * as path from 'path';
import * as fs from 'fs';
import { scanApiDirectory } from '../core/file-system/scan-api-dir.js';
import { writeManifest } from '../core/introspection/manifest.js';
import { parsedRoutesToSchema, runFileGeneration } from '../core/generation/run-file-generation.js';
import { buildApiBundle, getApiBundleFilename } from '../build/build-api-bundle.js';
import { buildSocketsBundle, getSocketsBundleFilename } from '../build/build-sockets-bundle.js';
import { API_BASE_PATH, API_DIR_NAME, getSocketBasePath } from '../shared/constants.js';
import type { PluginContext } from './context.js';

export function createBuildPlugin(ctx: PluginContext): Plugin {
  return {
    name: 'vitek:build',
    enforce: 'pre',

    configResolved(config) {
      ctx.root = config.root;
      ctx.buildOutDir = path.resolve(ctx.root!, config.build?.outDir ?? 'dist');
    },

    async buildStart() {
      if (!ctx.buildApi || !ctx.root) return;
      const fullApiDir = path.resolve(ctx.root, ctx.apiDirOption);
      if (!fs.existsSync(fullApiDir)) return;

      const scanResult = scanApiDirectory(fullApiDir);
      if (scanResult.routes.length === 0 && scanResult.sockets.length === 0) return;

      const schema = parsedRoutesToSchema(scanResult.routes);
      const socketBasePath = getSocketBasePath(
        ctx.options.apiBasePath,
        typeof ctx.options.sockets === 'object' ? ctx.options.sockets?.path : undefined
      );

      try {
        await runFileGeneration({
          root: ctx.root,
          schema,
          sockets: scanResult.sockets,
          apiBasePath: ctx.options.apiBasePath ?? API_BASE_PATH,
          socketBasePath,
          openApi: ctx.options.openApi,
          serverPort: 5173,
          onGenerationError: ctx.options.onGenerationError,
        });
        const plugins = ctx.options.plugins ?? [];
        const apiBasePath = ctx.options.apiBasePath ?? API_BASE_PATH;
        for (const plugin of plugins) {
          if (plugin.afterTypesGenerated) {
            await plugin.afterTypesGenerated({
              root: ctx.root,
              schema,
              sockets: scanResult.sockets,
              apiBasePath,
              socketBasePath,
            });
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('[vitek] Failed to generate types/services:', error.message);
        ctx.options.onGenerationError?.(error);
      }
    },

    async closeBundle() {
      if (!ctx.buildApi || !ctx.root || !ctx.buildOutDir) return;
      const fullApiDir = path.resolve(ctx.root, ctx.apiDirOption);
      try {
        writeManifest(ctx.root, ctx.apiDirOption, ctx.buildOutDir);
      } catch (err) {
        console.error('[vitek] Failed to write manifest:', err instanceof Error ? err.message : err);
      }
      try {
        await buildApiBundle({
          root: ctx.root,
          apiDir: fullApiDir,
          outDir: ctx.buildOutDir,
        });
      } catch (err) {
        console.error('[vitek] Failed to build API bundle:', err instanceof Error ? err.message : err);
      }
      const socketsEnabled = ctx.options.sockets !== false;
      if (socketsEnabled && fs.existsSync(fullApiDir)) {
        try {
          await buildSocketsBundle({
            root: ctx.root,
            apiDir: fullApiDir,
            outDir: ctx.buildOutDir,
          });
        } catch (err) {
          console.error('[vitek] Failed to build sockets bundle:', err instanceof Error ? err.message : err);
        }
      }
    },

    buildEnd() {
      if (ctx.cleanupFn) {
        ctx.cleanupFn();
        ctx.cleanupFn = null;
      }
    },
  };
}
