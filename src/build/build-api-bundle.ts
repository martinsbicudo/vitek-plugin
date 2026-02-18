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

  // Import route handlers (relative to entry so esbuild resolves correctly)
  scanResult.routes.forEach((parsed, i) => {
    const rel = path.relative(entryDir, parsed.file).replace(/\\/g, '/');
    const importPath = rel.startsWith('.') ? rel : `./${rel}`;
    lines.push(`import handler_${i} from ${JSON.stringify(importPath)};`);
  });

  // Import middleware modules
  scanResult.middlewares.forEach((mw, i) => {
    const rel = path.relative(entryDir, mw.path).replace(/\\/g, '/');
    const importPath = rel.startsWith('.') ? rel : `./${rel}`;
    lines.push(`import mw_${i} from ${JSON.stringify(importPath)};`);
  });

  // Build routes array: { pattern, method, handler, params, file, regex }
  const routeEntries = scanResult.routes.map((parsed, i) => {
    const regex = patternToRegex(parsed.pattern);
    const regexSource = regex.source;
    return `  { pattern: ${JSON.stringify(parsed.pattern)}, method: ${JSON.stringify(parsed.method)}, params: ${JSON.stringify(parsed.params)}, file: ${JSON.stringify(parsed.file)}, regex: new RegExp(${JSON.stringify(regexSource)}), handler: (handler_${i}.default ?? handler_${i}.handler ?? handler_${i}[${JSON.stringify(parsed.method)}]) }`;
  });
  lines.push('');
  lines.push('const routes = [');
  lines.push(routeEntries.join(',\n'));
  lines.push('];');

  // Build middlewares array: { basePattern, middleware: Middleware[] }
  const mwEntries = scanResult.middlewares.map((mw, i) => {
    return `  { basePattern: ${JSON.stringify(mw.basePattern)}, middleware: (() => { const m = mw_${i}.default ?? mw_${i}.middleware; return Array.isArray(m) ? m : [m]; })() }`;
  });
  lines.push('');
  lines.push('const middlewares = [');
  lines.push(mwEntries.join(',\n'));
  lines.push('];');
  lines.push('');
  lines.push('export { routes, middlewares };');

  return lines.join('\n');
}

/**
 * Builds the API bundle and writes it to outDir/vitek-api.mjs
 * Returns the path to the written file, or null if skipped (no apiDir, no routes, or error)
 */
export async function buildApiBundle(options: BuildApiBundleOptions): Promise<string | null> {
  const { root, apiDir, outDir } = options;

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

  try {
    await esbuild.build({
      entryPoints: [tmpEntry],
      bundle: true,
      format: 'esm',
      platform: 'node',
      outfile: outFile,
      external: ['vitek-plugin'],
    });
    return outFile;
  } finally {
    try {
      fs.unlinkSync(tmpEntry);
      if (fs.readdirSync(tmpDir).length === 0) {
        fs.rmdirSync(tmpDir);
      }
    } catch {
      // ignore cleanup errors
    }
  }
}

export function getApiBundleFilename(): string {
  return VITEK_API_BUNDLE_FILENAME;
}
