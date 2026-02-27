/**
 * vitek:transform — rewrite relative imports to root-relative paths
 */

import type { Plugin } from 'vite';
import * as path from 'path';
import MagicString from 'magic-string';
import {
  normalizeModuleIdPath,
  resolveWithExtension,
} from '../adapters/vite/path-utils.js';
import type { PluginContext } from './context.js';

export function createTransformPlugin(ctx: PluginContext): Plugin {
  return {
    name: 'vitek:transform',
    enforce: 'pre',

    // filter is supported in Vite 6.3+; ignored in Vite 5 (handler still works)
    transform: {
      filter: {
        id: { include: /\.(tsx?|jsx?|mjs)$/, exclude: /node_modules/ },
      },
      handler(code: string, id: string) {
        if (!ctx.root) return null;
        // Early return for Vite 5 (filter ignored); filter handles this in Vite 6.3+
        if (id.includes('node_modules') || !/\.(tsx?|jsx?|mjs)$/.test(id)) return null;
        const srcDir = path.resolve(ctx.root, ctx.options.srcDir ?? 'src');
        const normalizedId = normalizeModuleIdPath(id, ctx.root);
        if (!normalizedId.startsWith(srcDir)) return null;
        const dir = path.dirname(normalizedId);
        const rootSlash = path.resolve(ctx.root) + path.sep;
        const relImportRe = /from\s+['"](\.\.?[^'"]+)['"]/g;
        let match: RegExpExecArray | null;
        const s = new MagicString(code);
        let hasChanges = false;
        while ((match = relImportRe.exec(code)) !== null) {
          const specifier = match[1];
          const candidate = path.resolve(dir, specifier);
          if (!candidate.startsWith(rootSlash)) continue;
          const target = resolveWithExtension(candidate);
          if (!target) continue;
          const rootRelative = path.relative(ctx.root, target).replace(/\\/g, '/');
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
    } as unknown as NonNullable<Plugin['transform']>,
  };
}
