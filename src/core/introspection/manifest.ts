import * as path from 'path';
import * as fs from 'fs';
import { scanApiDirectory } from '../file-system/scan-api-dir.js';
import type { ParsedRoute } from '../routing/route-parser.js';
import type { ParsedSocket } from '../routing/socket-parser.js';

export interface VitekManifest {
  routes: Array<{
    method: string;
    pattern: string;
    params: string[];
    file: string;
  }>;
  middlewares: Array<{
    basePattern: string;
    path: string;
  }>;
  sockets: Array<{
    pattern: string;
    params: string[];
    file: string;
  }>;
}

export function getManifest(root: string, apiDir: string): VitekManifest {
  const fullApiDir = path.isAbsolute(apiDir) ? apiDir : path.resolve(root, apiDir);
  const scanResult = scanApiDirectory(fullApiDir);
  return {
    routes: scanResult.routes.map((r) => ({
      method: r.method,
      pattern: r.pattern,
      params: r.params,
      file: path.relative(root, r.file).replace(/\\/g, '/'),
    })),
    middlewares: scanResult.middlewares.map((m) => ({
      basePattern: m.basePattern,
      path: path.relative(root, m.path).replace(/\\/g, '/'),
    })),
    sockets: scanResult.sockets.map((s) => ({
      pattern: s.pattern,
      params: s.params,
      file: path.relative(root, s.file).replace(/\\/g, '/'),
    })),
  };
}

export function getRoutes(root: string, apiDir: string): ParsedRoute[] {
  const fullApiDir = path.isAbsolute(apiDir) ? apiDir : path.resolve(root, apiDir);
  const scanResult = scanApiDirectory(fullApiDir);
  return scanResult.routes;
}

export function getSockets(root: string, apiDir: string): ParsedSocket[] {
  const fullApiDir = path.isAbsolute(apiDir) ? apiDir : path.resolve(root, apiDir);
  const scanResult = scanApiDirectory(fullApiDir);
  return scanResult.sockets;
}

export function writeManifest(
  root: string,
  apiDir: string,
  outDir: string
): string {
  const manifest = getManifest(root, apiDir);
  const manifestPath = path.join(outDir, 'vitek-manifest.json');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  return manifestPath;
}
