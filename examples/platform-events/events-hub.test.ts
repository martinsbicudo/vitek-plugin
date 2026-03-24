import { describe, it, expect } from 'vitest';
import { hub, recentAudit } from './src/lib/events-hub';

describe('events hub', () => {
  it('records audit actions via bus', async () => {
    await hub.emit('audit', { action: 'alpha' });
    await hub.emit('audit', { action: 'beta' });
    expect(recentAudit().slice(0, 2)).toEqual(['beta', 'alpha']);
  });
});
