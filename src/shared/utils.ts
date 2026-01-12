/**
 * Shared utilities
 */

/**
 * Normalizes a path by removing double slashes and ensuring consistent format
 * Preserves the leading slash if present
 */
export function normalizePath(path: string): string {
  const normalized = path.replace(/\/+/g, '/');
  // If it ends with / and it's not just the root slash, remove it
  if (normalized !== '/' && normalized.endsWith('/')) {
    return normalized.slice(0, -1);
  }
  return normalized || '/';
}

/**
 * Checks if a string is a valid HTTP method
 */
export function isHttpMethod(str: string): str is 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' {
  return ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(str.toLowerCase());
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

