import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from './event-bus.js';

describe('createEventBus', () => {
  it('emits payload to subscribed handlers', async () => {
    const bus = createEventBus<{ 'user.created': { id: string } }>();
    const handler = vi.fn();
    bus.on('user.created', handler);
    await bus.emit('user.created', { id: 'u1' });
    expect(handler).toHaveBeenCalledWith({ id: 'u1' });
  });

  it('unsubscribe removes handler', async () => {
    const bus = createEventBus<{ ping: string }>();
    const handler = vi.fn();
    const off = bus.on('ping', handler);
    off();
    await bus.emit('ping', 'x');
    expect(handler).not.toHaveBeenCalled();
  });
});
