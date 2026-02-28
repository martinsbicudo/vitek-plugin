/**
 * vitek:resolve — resolveId for relative imports in API files
 */

import type { Plugin } from 'vite';
import * as path from 'path';
import { pathToFileURL } from 'url';
import {
  normalizeImporterPath,
  resolveWithExtension,
} from '../adapters/vite/path-utils.js';
import type { PluginContext } from './context.js';

export function createResolvePlugin(ctx: PluginContext): Plugin {
  return {
    name: 'vitek:resolve',
    enforce: 'pre',

    resolveId(id, importer) {
      const root = ctx.root ?? process.cwd();
      if (!id.startsWith('.') || !importer) return null;
      const fullApiDir = path.resolve(root, ctx.apiDirOption);
      const importerPath = normalizeImporterPath(importer, root);
      const normalizedApiDir = path.resolve(fullApiDir);
      const normalizedImporter = path.resolve(importerPath);
      if (!normalizedImporter.startsWith(normalizedApiDir)) return null;
      const candidate = path.resolve(path.dirname(normalizedImporter), id);
      const resolved = resolveWithExtension(candidate);
      return resolved ? pathToFileURL(resolved).href : null;
    },
  };
}
