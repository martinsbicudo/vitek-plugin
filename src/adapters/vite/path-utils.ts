/**
 * Path normalization utilities for Vite plugin hooks.
 * Centralizes logic for importer/module id resolution (file:, /, absolute).
 */

import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const EXTENSIONS = ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs'];

/**
 * Converts an importer string (from resolveId) to an absolute filesystem path.
 * Handles file: URLs, leading-slash paths (virtual), and absolute paths.
 */
export function normalizeImporterPath(importer: string, root: string): string {
  if (importer.startsWith('file:')) {
    return fileURLToPath(importer);
  }
  if (importer.startsWith('/')) {
    const virtualPath = path.join(root, importer.replace(/^\//, ''));
    return fs.existsSync(virtualPath) ? virtualPath : path.resolve(importer);
  }
  return path.resolve(importer);
}

/**
 * Converts a module id (from transform/resolveId) to an absolute filesystem path.
 * Handles file: URLs and leading-slash paths (virtual).
 */
export function normalizeModuleIdPath(id: string, root: string): string {
  const idPath = id.startsWith('file:') ? fileURLToPath(id) : id;
  if (idPath.startsWith('/')) {
    const virtualPath = path.join(root, idPath.replace(/^\//, ''));
    return fs.existsSync(virtualPath) ? virtualPath : path.resolve(idPath);
  }
  return path.resolve(idPath);
}

/**
 * Resolves a path to an existing file, trying extensions if the path has none.
 * Returns the resolved absolute path or null if not found.
 */
export function resolveWithExtension(filePath: string): string | null {
  if (fs.existsSync(filePath)) return filePath;
  const ext = EXTENSIONS.find((e) => fs.existsSync(filePath + e));
  if (ext) return filePath + ext;
  return null;
}
