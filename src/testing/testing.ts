import type { VitekContext, VitekRequest } from '../core/context/create-context.js';
import { compose } from '../core/middleware/compose.js';
import type { Middleware } from '../core/routing/route-types.js';

export interface MockServerResponse {
  statusCode: number;
  headers: Record<string, string | number | string[]>;
  bodyChunks: Buffer[];
  setHeader(name: string, value: string | number | string[]): void;
  getHeader(name: string): string | number | string[] | undefined;
  end(chunk?: string | Buffer): void;
}

export function createMockContext(overrides?: Partial<VitekContext>): VitekContext {
  const url = overrides?.url ?? 'http://localhost/api/health';
  const path = overrides?.path ?? new URL(url, 'http://localhost').pathname;
  return {
    url,
    method: overrides?.method ?? 'get',
    path,
    query: { ...overrides?.query },
    params: { ...overrides?.params },
    headers: { ...overrides?.headers },
    body: overrides?.body,
    clientIp: overrides?.clientIp,
    sockets: overrides?.sockets,
  };
}

export function createMockReq(overrides?: Partial<VitekRequest>): VitekRequest {
  return {
    url: overrides?.url ?? 'http://localhost/api/health',
    method: overrides?.method ?? 'GET',
    headers: { ...overrides?.headers },
    body: overrides?.body,
  };
}

export function createMockRes(): MockServerResponse {
  const headers: Record<string, string | number | string[]> = {};
  const bodyChunks: Buffer[] = [];
  const res: MockServerResponse = {
    statusCode: 200,
    headers,
    bodyChunks,
    setHeader(name, value) {
      headers[name.toLowerCase()] = value;
    },
    getHeader(name) {
      return headers[name.toLowerCase()];
    },
    end(chunk) {
      if (chunk !== undefined) {
        bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      }
    },
  };
  return res;
}

export async function runMiddlewareChain(
  context: VitekContext,
  middlewares: Middleware[],
): Promise<void> {
  const composed = compose(middlewares);
  await composed(context, async () => {});
}
