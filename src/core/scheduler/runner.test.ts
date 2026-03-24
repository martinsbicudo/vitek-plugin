import { describe, expect, it, vi } from 'vitest';
import { runScheduleOnce } from './runner.js';
import { InMemoryLockProvider } from './in-memory-lock.js';

describe('runScheduleOnce', () => {
  it('runs all tasks and returns success', async () => {
    const a = vi.fn();
    const b = vi.fn();
    const result = await runScheduleOnce({
      tasks: [
        { name: 'a', cron: '* * * * *', run: a },
        { name: 'b', cron: '*/5 * * * *', run: b },
      ],
    });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    expect(result.tasks.map((t) => t.ok)).toEqual([true, true]);
  });

  it('captures task errors', async () => {
    const result = await runScheduleOnce({
      tasks: [{ name: 'x', cron: '* * * * *', run: () => Promise.reject(new Error('boom')) }],
    });
    expect(result.tasks[0].ok).toBe(false);
    expect(result.tasks[0].error).toContain('boom');
  });

  it('reports lock miss when lock not acquired', async () => {
    const lock = new InMemoryLockProvider();
    const first = await lock.acquire('locked');
    expect(first).not.toBeNull();
    const result = await runScheduleOnce(
      {
        tasks: [{ name: 'locked', cron: '* * * * *', run: () => {} }],
      },
      { lockProvider: lock }
    );
    expect(result.tasks[0].ok).toBe(false);
    expect(result.tasks[0].error).toContain('lock');
    first?.();
  });
});
