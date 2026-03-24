import type { IssueDispatcher, IssueEvent } from '../../core/dispatch/types.js';

export interface HttpWebhookIssueDispatcherOptions {
  url: string;
  headers?: Record<string, string>;
  retries?: number;
  backoffMs?: number;
  onDeadLetter?: (event: IssueEvent, error: Error) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createHttpWebhookIssueDispatcher(
  options: HttpWebhookIssueDispatcherOptions
): IssueDispatcher {
  const retries = options.retries ?? 2;
  const backoffMs = options.backoffMs ?? 150;

  return {
    async dispatch(event: IssueEvent): Promise<void> {
      let lastError: Error | null = null;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const res = await fetch(options.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(options.headers ?? {}),
            },
            body: JSON.stringify(event),
          });
          if (res.ok) {
            return;
          }
          throw new Error(`Dispatch webhook failed with status ${res.status}`);
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          if (attempt < retries) {
            await sleep(backoffMs * Math.pow(2, attempt));
            continue;
          }
        }
      }
      const finalError = lastError ?? new Error('Dispatch webhook failed');
      options.onDeadLetter?.(event, finalError);
      throw finalError;
    },
  };
}
