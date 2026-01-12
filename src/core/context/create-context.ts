/**
 * Context creation for route handlers
 * Core logic - runtime agnostic
 */

export interface VitekContext {
  url: string;
  method: string;
  path: string;
  query: Record<string, string | string[]>;
  params: Record<string, string>;
  headers: Record<string, string>;
  body?: any;
}

export interface VitekRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}

/**
 * Response object that allows control over status code and headers
 * If a handler returns a plain object, it will be treated as status 200 with JSON content-type
 */
export interface VitekResponse {
  status?: number;
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Type guard to check if a value is a VitekResponse
 * A VitekResponse is identified by having 'status' (number) or 'headers' (object) properties
 * Plain objects without these properties are treated as regular JSON responses (backward compatibility)
 */
export function isVitekResponse(value: any): value is VitekResponse {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  
  // It's a VitekResponse if it has 'status' (number) or 'headers' (object) properties
  // These are clear indicators of a response object, not a data object
  const hasStatus = 'status' in value && typeof value.status === 'number';
  const hasHeaders = 'headers' in value && typeof value.headers === 'object' && value.headers !== null && !Array.isArray(value.headers);
  
  return hasStatus || hasHeaders;
}

/**
 * Creates a context from a request and extracted parameters
 */
export function createContext(
  request: VitekRequest,
  params: Record<string, string> = {},
  query: Record<string, string | string[]> = {}
): VitekContext {
  const url = new URL(request.url, 'http://localhost');
  
  return {
    url: request.url,
    method: request.method.toLowerCase(),
    path: url.pathname,
    query,
    params,
    headers: request.headers,
    body: request.body,
  };
}

