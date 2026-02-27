const ROUTE_FILE_PATTERN = /^(.+)\.(get|post|put|patch|delete|head|options)\.(ts|js)$/;
const MIDDLEWARE_FILE_PATTERN = /^middleware\.(ts|js)$/;
const SOCKET_FILE_PATTERN = /^(.+)\.socket\.(ts|js)$/;

function normalizePathPart(pathPart: string): string {
  return pathPart
    .replace(/\[\.\.\.([^\]]+)\]/g, '*$1')
    .replace(/\[([^\]]+)\]/g, ':$1');
}

export type ConventionResult =
  | { valid: true; type: 'route'; method: string; pattern: string; params: string[] }
  | { valid: true; type: 'middleware'; basePattern: string }
  | { valid: true; type: 'socket'; pattern: string; params: string[] }
  | { valid: false; message: string };

export function validateConvention(filePath: string, apiDir: string = 'src/api'): ConventionResult {
  const normalized = filePath.replace(/\\/g, '/');
  const apiDirNorm = apiDir.replace(/\\/g, '/').replace(/\/+$/, '');
  let relative = normalized;
  if (normalized.includes(apiDirNorm + '/')) {
    relative = normalized.slice(normalized.indexOf(apiDirNorm) + apiDirNorm.length).replace(/^\//, '');
  } else if (normalized.startsWith(apiDirNorm)) {
    relative = normalized.slice(apiDirNorm.length).replace(/^\//, '');
  }

  const routeMatch = relative.match(ROUTE_FILE_PATTERN);
  if (routeMatch) {
    const [, pathPart, method] = routeMatch;
    const pattern = normalizePathPart(pathPart.replace(/\/index$/, '').replace(/^\/+/, ''));
    const params: string[] = [];
    const paramRegex = /[:*]([^/]+)/g;
    let m;
    while ((m = paramRegex.exec(pattern)) !== null) params.push(m[1]);
    return { valid: true, type: 'route', method: method!.toLowerCase(), pattern, params };
  }

  if (MIDDLEWARE_FILE_PATTERN.test(relative) || relative.endsWith('/middleware.ts') || relative.endsWith('/middleware.js')) {
    const basePattern = relative.includes('/')
      ? normalizePathPart(relative.replace(/\/middleware\.(ts|js)$/, '').replace(/^\//, ''))
      : '';
    return { valid: true, type: 'middleware', basePattern };
  }

  const socketMatch = relative.match(SOCKET_FILE_PATTERN);
  if (socketMatch) {
    const [, pathPart] = socketMatch;
    const pattern = normalizePathPart(pathPart.replace(/\/index$/, '').replace(/^\/+/, ''));
    const params: string[] = [];
    const paramRegex = /[:*]([^/]+)/g;
    let m;
    while ((m = paramRegex.exec(pattern)) !== null) params.push(m[1]);
    return { valid: true, type: 'socket', pattern, params };
  }

  return { valid: false, message: 'Not a Vitek route, middleware, or socket file. Expected [name].[method].ts, middleware.ts, or [name].socket.ts' };
}
