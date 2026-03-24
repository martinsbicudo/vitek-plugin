import type { RequestLogMeta } from '../../core/server/request-log-meta.js';

function emit(record: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      component: 'vitek',
      ...record,
    })
  );
}

export function createConsoleStructuredRequestLogger(): {
  requestStart(method: string, path: string, meta?: RequestLogMeta): void;
  request(method: string, path: string, statusCode: number, duration?: number, meta?: RequestLogMeta): void;
} {
  return {
    requestStart(method: string, path: string, meta?: RequestLogMeta) {
      emit({
        event: 'http.request.start',
        method,
        path,
        ...(meta?.requestId != null ? { requestId: meta.requestId } : {}),
        ...(meta?.route != null ? { route: meta.route } : {}),
      });
    },
    request(method: string, path: string, statusCode: number, duration?: number, meta?: RequestLogMeta) {
      emit({
        event: 'http.request.complete',
        method,
        path,
        status: statusCode,
        ...(duration !== undefined ? { durationMs: duration } : {}),
        ...(meta?.requestId != null ? { requestId: meta.requestId } : {}),
        ...(meta?.route != null ? { route: meta.route } : {}),
      });
    },
  };
}
