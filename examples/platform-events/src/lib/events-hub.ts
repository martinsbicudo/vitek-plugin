import { createEventBus } from 'vitek-plugin/events';

type AppEvents = { audit: { action: string } };

export const hub = createEventBus<AppEvents>();

const entries: string[] = [];

hub.on('audit', (payload) => {
  entries.unshift(payload.action);
  if (entries.length > 50) entries.length = 50;
});

export function recentAudit(): string[] {
  return [...entries];
}
