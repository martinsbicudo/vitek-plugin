import { describe, it, expect, vi } from 'vitest';
import { emitIssueSafe } from './emit-safe.js';

const baseEvent = {
  id: '1',
  timestamp: new Date().toISOString(),
  severity: 'error' as const,
  source: 'manual' as const,
  title: 't',
  message: 'm',
};

describe('emitIssueSafe', () => {
  it('no-ops when dispatcher is undefined', () => {
    emitIssueSafe(undefined, baseEvent);
  });

  it('invokes sync dispatch', () => {
    const dispatch = vi.fn();
    emitIssueSafe({ dispatch }, baseEvent);
    expect(dispatch).toHaveBeenCalledWith(baseEvent);
  });

  it('invokes async dispatch', async () => {
    const dispatch = vi.fn().mockResolvedValue(undefined);
    emitIssueSafe({ dispatch }, baseEvent);
    await vi.waitFor(() => expect(dispatch).toHaveBeenCalled());
  });

  it('calls onError when dispatch rejects', async () => {
    const dispatch = vi.fn().mockRejectedValue(new Error('sink failed'));
    const onError = vi.fn();
    emitIssueSafe({ dispatch }, baseEvent, onError);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith('Issue dispatch failed', { message: 'sink failed' }));
  });
});
