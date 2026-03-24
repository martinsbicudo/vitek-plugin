import { describe, expect, it, vi } from 'vitest';
import { createHttpWebhookIssueDispatcher } from './http-webhook.js';

const event = {
  id: 'evt-1',
  timestamp: new Date().toISOString(),
  severity: 'error' as const,
  source: 'runtime.http' as const,
  title: 'Unhandled API error',
  message: 'boom',
};

describe('createHttpWebhookIssueDispatcher', () => {
  it('dispatches successfully on first attempt', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      })
    );
    const d = createHttpWebhookIssueDispatcher({ url: 'https://example.test/hook' });
    await expect(d.dispatch(event)).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries and calls dead-letter callback when exhausted', async () => {
    vi.useFakeTimers();
    const deadLetter = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network down'))
    );
    const d = createHttpWebhookIssueDispatcher({
      url: 'https://example.test/hook',
      retries: 2,
      backoffMs: 1,
      onDeadLetter: deadLetter,
    });
    const p = d.dispatch(event).catch((err) => err);
    await vi.runAllTimersAsync();
    const err = await p;
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toContain('network down');
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(deadLetter).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
