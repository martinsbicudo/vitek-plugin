/**
 * Builds the sockets bundle for preview/production
 * Scans apiDir for *.socket.ts/js, generates an entry module, bundles with esbuild
 */

import * as path from 'path';
import * as fs from 'fs';
import { scanApiDirectory } from '../core/file-system/scan-api-dir.js';
import { patternToRegex } from '../core/normalize/normalize-path.js';
import type { ParsedSocket } from '../core/routing/socket-parser.js';
import { VITEK_SOCKETS_BUNDLE_FILENAME } from '../shared/constants.js';

const ESM_REQUIRE_SHIM =
  'import { createRequire as __createRequire } from "node:module";\n' +
  'const require = __createRequire(import.meta.url);\n';

export interface BuildSocketsBundleOptions {
  root: string;
  apiDir: string;
  outDir: string;
}

/**
 * Generates the entry file content that imports all socket handlers
 * and exports { sockets } in the shape expected by createSocketHandler
 */
function generateSocketsEntryContent(sockets: ParsedSocket[], entryDir: string): string {
  const lines: string[] = [];

  sockets.forEach((parsed, i) => {
    const rel = path.relative(entryDir, parsed.file).replace(/\\/g, '/');
    const importPath = rel.startsWith('.') ? rel : `./${rel}`;
    lines.push(`import handler_${i} from ${JSON.stringify(importPath)};`);
  });

  const socketEntries = sockets.map((parsed, i) => {
    const regex = patternToRegex(parsed.pattern);
    const regexSource = regex.source;
    return `  { pattern: ${JSON.stringify(parsed.pattern)}, params: ${JSON.stringify(parsed.params)}, file: ${JSON.stringify(parsed.file)}, regex: new RegExp(${JSON.stringify(regexSource)}), handler: (() => { const m = handler_${i}; return typeof m === 'function' ? m : m.default; })() }`;
  });
  lines.push('');
  lines.push('const sockets = [');
  lines.push(socketEntries.join(',\n'));
  lines.push('];');
  lines.push('');
  lines.push('export { sockets };');

  return lines.join('\n');
}

function ensureEsmRequireShim(outFile: string): void {
  if (!fs.existsSync(outFile)) return;
  const content = fs.readFileSync(outFile, 'utf-8');
  if (content.includes('__createRequire(import.meta.url)')) return;
  fs.writeFileSync(outFile, `${ESM_REQUIRE_SHIM}${content}`, 'utf-8');
}

/**
 * Builds the sockets bundle and writes it to outDir/vitek-sockets.mjs
 * Returns the path to the written file, or null if skipped (no sockets or error)
 */
export async function buildSocketsBundle(
  options: BuildSocketsBundleOptions
): Promise<string | null> {
  const { apiDir, outDir } = options;

  if (!fs.existsSync(apiDir)) {
    return null;
  }

  const scanResult = scanApiDirectory(apiDir);
  if (scanResult.sockets.length === 0) {
    return null;
  }

  const tmpDir = path.join(outDir, '.vitek-tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const tmpEntry = path.join(tmpDir, 'vitek-sockets-entry.mts');
  const entryContent = generateSocketsEntryContent(
    scanResult.sockets,
    path.dirname(tmpEntry)
  );
  fs.writeFileSync(tmpEntry, entryContent, 'utf-8');

  const outFile = path.join(outDir, VITEK_SOCKETS_BUNDLE_FILENAME);

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
    ensureEsmRequireShim(outFile);
    return outFile;
  } finally {
    try {
      fs.unlinkSync(tmpEntry);
      if (fs.existsSync(tmpDir) && fs.readdirSync(tmpDir).length === 0) {
        fs.rmdirSync(tmpDir);
      }
    } catch {
      // ignore cleanup errors
    }
  }
}

export function getSocketsBundleFilename(): string {
  return VITEK_SOCKETS_BUNDLE_FILENAME;
}
