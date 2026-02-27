/**
 * Builds the API bundle for preview/production
 * Scans apiDir, generates an entry module, bundles with esbuild
 */

import * as path from 'path';
import * as fs from 'fs';
import { scanApiDirectory } from '../core/file-system/scan-api-dir.js';
import { patternToRegex } from '../core/normalize/normalize-path.js';
import type { ParsedRoute } from '../core/routing/route-parser.js';
import type { MiddlewareInfo } from '../core/file-system/scan-api-dir.js';

const VITEK_API_BUNDLE_FILENAME = 'vitek-api.mjs';

export interface BuildApiBundleOptions {
  root: string;
  apiDir: string;
  outDir: string;
  alias?: Record<string, string>;
}

/**
 * Generates the virtual entry file content that imports all route handlers and middlewares
 * and exports { routes, middlewares } in the shape expected by createRequestHandler
 * entryDir: directory of the generated entry file (for relative imports)
 */
function generateEntryContent(
  scanResult: { routes: ParsedRoute[]; middlewares: MiddlewareInfo[] },
  entryDir: string
): string {
  const lines: string[] = [];

  scanResult.routes.forEach((parsed, i) => {
    const rel = path.relative(entryDir, parsed.file).replace(/\\/g, '/');
    const importPath = rel.startsWith('.') ? rel : `./${rel}`;
    lines.push(`import handler_${i} from ${JSON.stringify(importPath)};`);
  });

  scanResult.middlewares.forEach((mw, i) => {
    const rel = path.relative(entryDir, mw.path).replace(/\\/g, '/');
    const importPath = rel.startsWith('.') ? rel : `./${rel}`;
    // Use namespace import so we can read both default and named export 'config' (for global pathPatterns)
    lines.push(`import * as mw_${i}_ns from ${JSON.stringify(importPath)};`);
  });

  const routeEntries = scanResult.routes.map((parsed, i) => {
    const regex = patternToRegex(parsed.pattern);
    const regexSource = regex.source;
    return `  { pattern: ${JSON.stringify(parsed.pattern)}, method: ${JSON.stringify(parsed.method)}, params: ${JSON.stringify(parsed.params)}, file: ${JSON.stringify(parsed.file)}, regex: new RegExp(${JSON.stringify(regexSource)}), handler: (() => { const m = handler_${i}; return typeof m === 'function' ? m : (m.default ?? m.handler ?? m[${JSON.stringify(parsed.method)}]); })() }`;
  });
  lines.push('');
  lines.push('const routes = [');
  lines.push(routeEntries.join(',\n'));
  lines.push('];');

  const mwEntries = scanResult.middlewares.map((mw, i) => {
    const base = `  { basePattern: ${JSON.stringify(mw.basePattern)}, middleware: (() => { const m = mw_${i}_ns.default ?? mw_${i}_ns; const fn = typeof m === 'function' || Array.isArray(m) ? m : (m?.default ?? m?.middleware); return Array.isArray(fn) ? fn : [fn]; })()`;
    if (mw.basePattern === '') {
      return `${base}, pathPatterns: (() => { const c = mw_${i}_ns?.config; if (!c?.path) return undefined; const p = Array.isArray(c.path) ? c.path : [c.path]; return p.map((x) => String(x).replace(/^\\/api\\/?/, '').replace(/^\\/+|\\/+$/g, '')); })() }`;
    }
    return `${base} }`;
  });
  lines.push('');
  lines.push('const middlewares = [');
  lines.push(mwEntries.join(',\n'));
  lines.push('];');
  lines.push('');
  lines.push('export { routes, middlewares };');

  return lines.join('\n');
}

function createAliasPlugin(root: string, alias: Record<string, string>): { name: string; setup: (build: unknown) => void } {
  const entries = Object.entries(alias)
    .filter(([, v]) => v != null && v !== '')
    .sort(([a], [b]) => b.length - a.length);
  return {
    name: 'vitek-alias',
    setup(build: unknown) {
      if (entries.length === 0) return;
      const b = build as { onResolve: (opts: { filter: RegExp }, fn: (args: { path: string }) => { path: string } | null) => void };
      const filter = new RegExp('^(' + entries.map(([k]) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(/|$)');
      b.onResolve({ filter }, (args) => {
        const imp = args.path;
        for (const [key, value] of entries) {
          if (imp === key || imp.startsWith(key + '/')) {
            const rest = imp.slice(key.length).replace(/^\//, '') || '';
            const base = path.resolve(root, value, rest);
            const withExt = ['.js', '.ts', '.mjs', '.cjs'].find((ext) => fs.existsSync(base + ext));
            const resolved = withExt ? base + withExt : base;
            return { path: resolved };
          }
        }
        return null;
      });
    },
  };
}

/**
 * Builds the API bundle and writes it to outDir/vitek-api.mjs
 * Returns the path to the written file, or null if skipped (no apiDir, no routes, or error)
 */
export async function buildApiBundle(options: BuildApiBundleOptions): Promise<string | null> {
  const { root, apiDir, outDir, alias } = options;

  if (!fs.existsSync(apiDir)) {
    return null;
  }

  const scanResult = scanApiDirectory(apiDir);
  if (scanResult.routes.length === 0 && scanResult.middlewares.length === 0) {
    return null;
  }

  const tmpDir = path.join(outDir, '.vitek-tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const tmpEntry = path.join(tmpDir, 'vitek-api-entry.mts');
  const entryContent = generateEntryContent(scanResult, path.dirname(tmpEntry));
  fs.writeFileSync(tmpEntry, entryContent, 'utf-8');

  const outFile = path.join(outDir, VITEK_API_BUNDLE_FILENAME);

  const esbuild = (await import('esbuild').catch(() => null)) as {
    build: (opts: unknown) => Promise<void>;
  } | null;
  if (!esbuild) {
    return null;
  }

  const plugins = alias && Object.keys(alias).length > 0 ? [createAliasPlugin(root, alias)] : [];
  try {
    await esbuild.build({
      entryPoints: [tmpEntry],
      bundle: true,
      format: 'esm',
      platform: 'node',
      outfile: outFile,
      external: ['vitek-plugin'],
      minify: true,
      plugins,
    });
    return outFile;
  } finally {
    try {
      fs.unlinkSync(tmpEntry);
      if (fs.readdirSync(tmpDir).length === 0) {
        fs.rmdirSync(tmpDir);
      }
    } catch {
    }
  }
}

export function getApiBundleFilename(): string {
  return VITEK_API_BUNDLE_FILENAME;
}
