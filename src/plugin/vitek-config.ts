import type { Plugin } from 'vite';
import * as path from 'path';
import type { PluginContext } from './context.js';

function toAliasEntries(
  alias: unknown,
  root: string
): Array<{ find: string; replacement: string }> {
  if (!alias) return [];
  if (Array.isArray(alias)) {
    return alias
      .filter(
        (a): a is { find: string | RegExp; replacement: string } =>
          typeof a === 'object' && a !== null && 'find' in a && 'replacement' in a
      )
      .map((a) => ({
        find: typeof a.find === 'string' ? a.find : a.find.toString(),
        replacement: String(a.replacement),
      }));
  }
  if (typeof alias === 'object' && alias !== null && !Array.isArray(alias)) {
    return Object.entries(alias as Record<string, string>).map(([find, replacement]) => ({
      find,
      replacement: path.isAbsolute(replacement)
        ? replacement
        : path.resolve(root, replacement),
    }));
  }
  return [];
}

export function createConfigPlugin(ctx: PluginContext): Plugin {
  return {
    name: 'vitek:config',
    enforce: 'pre',
    config(config) {
      const root = config.root ?? process.cwd();
      const result: Record<string, unknown> = {};

      const raw = config.optimizeDeps?.exclude;
      const existingExclude = Array.isArray(raw) ? raw : raw ? [raw] : [];
      const exclude = [...existingExclude, 'vitek-plugin'];
      result.optimizeDeps = { ...config.optimizeDeps, exclude };

      const userAlias = ctx.options.alias;
      if (userAlias && Object.keys(userAlias).length > 0) {
        const existingEntries = toAliasEntries(config.resolve?.alias, root);
        const ourEntries = Object.entries(userAlias).map(([find, replacement]) => ({
          find,
          replacement: path.isAbsolute(replacement)
            ? replacement
            : path.resolve(root, replacement),
        }));
        result.resolve = {
          ...config.resolve,
          alias: [...existingEntries, ...ourEntries],
        };
      }

      return result;
    },
  };
}
