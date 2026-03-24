import type { IssueDispatcher, IssueEvent } from './types.js';

export function emitIssueSafe(
  dispatcher: IssueDispatcher | undefined,
  event: IssueEvent,
  onError?: (message: string, data?: Record<string, unknown>) => void
): void {
  if (!dispatcher) return;
  Promise.resolve(dispatcher.dispatch(event)).catch((err) => {
    if (!onError) return;
    const message = err instanceof Error ? err.message : String(err);
    onError('Issue dispatch failed', { message });
  });
}
