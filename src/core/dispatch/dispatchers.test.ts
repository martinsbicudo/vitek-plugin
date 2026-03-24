import { describe, expect, it, vi } from 'vitest';
import { createConsoleIssueDispatcher, createNoopIssueDispatcher } from './dispatchers.js';

describe('dispatchers', () => {
  it('noop dispatcher does nothing', async () => {
    const d = createNoopIssueDispatcher();
    await Promise.resolve(
      d.dispatch({
        id: '1',
        timestamp: new Date().toISOString(),
        severity: 'info',
        source: 'manual',
        title: 'x',
        message: 'y',
      })
    );
    expect(true).toBe(true);
  });

  it('console dispatcher writes json line', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const d = createConsoleIssueDispatcher();
    d.dispatch({
      id: '1',
      timestamp: new Date().toISOString(),
      severity: 'warning',
      source: 'runtime.http',
      title: 'warn',
      message: 'message',
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0][0])).toContain('"event":"issue.dispatch"');
    spy.mockRestore();
  });
});
