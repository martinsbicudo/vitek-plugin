import * as path from 'path';

export function resolvePathUnderRoot(root: string, relativePath: string): string | null {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const resolved = path.resolve(root, normalized);
  const rootResolved = path.resolve(root);
  const prefix = rootResolved.endsWith(path.sep) ? rootResolved : rootResolved + path.sep;
  if (resolved !== rootResolved && !resolved.startsWith(prefix)) {
    return null;
  }
  return resolved;
}

export function assertUnderApiDir(root: string, apiDir: string, absolutePath: string): boolean {
  const apiRoot = path.resolve(root, apiDir);
  const prefix = apiRoot.endsWith(path.sep) ? apiRoot : apiRoot + path.sep;
  return absolutePath === apiRoot || absolutePath.startsWith(prefix);
}
