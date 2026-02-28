/**
 * vitek:transform — rewrite relative and alias imports to root-relative paths
 */

import type { Plugin } from 'vite';
import * as path from 'path';
import MagicString from 'magic-string';
import {
  normalizeModuleIdPath,
  resolveWithExtension,
} from '../adapters/vite/path-utils.js';
import type { PluginContext } from './context.js';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function createTransformPlugin(ctx: PluginContext): Plugin {
  return {
    name: 'vitek:transform',
    enforce: 'pre',

    transform: {
      filter: {
        id: { include: /\.(tsx?|jsx?|mjs)$/, exclude: /node_modules/ },
      },
      handler(code: string, id: string) {
        if (!ctx.root) return null;
        if (id.includes('node_modules') || !/\.(tsx?|jsx?|mjs)$/.test(id)) return null;
        const srcDir = path.resolve(ctx.root, ctx.options.srcDir ?? 'src');
        const normalizedId = normalizeModuleIdPath(id, ctx.root);
        if (!normalizedId.startsWith(srcDir)) return null;
        const dir = path.dirname(normalizedId);
        const rootSlash = path.resolve(ctx.root) + path.sep;
        const s = new MagicString(code);
        let hasChanges = false;

        const relImportRe = /from\s+['"](\.\.?[^'"]+)['"]/g;
        let match: RegExpExecArray | null;
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

        const alias = ctx.options.alias;
        if (alias && Object.keys(alias).length > 0) {
          const entries = Object.entries(alias)
            .filter(([, v]) => v != null && v !== '')
            .sort(([a], [b]) => b.length - a.length);
          for (const [key, replacement] of entries) {
            const escapedKey = escapeRegex(key);
            const aliasRe = new RegExp(`from\\s+(['"])(${escapedKey})(/[^'"]*)?\\1`, 'g');
            while ((match = aliasRe.exec(code)) !== null) {
              const quote = match[1];
              const rest = (match[3] || '').replace(/^\//, '');
              const base = path.isAbsolute(replacement)
                ? path.join(replacement, rest)
                : path.join(ctx.root, replacement, rest);
              const target = resolveWithExtension(base);
              if (!target) continue;
              const rootRelative = path.relative(ctx.root, target).replace(/\\/g, '/');
              const newSpecifier = `/${rootRelative}`;
              s.overwrite(match.index, match.index + match[0].length, `from ${quote}${newSpecifier}${quote}`);
              hasChanges = true;
            }
          }
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
