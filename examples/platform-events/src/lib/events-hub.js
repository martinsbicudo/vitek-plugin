import { createEventBus } from 'vitek-plugin/events';
export const hub = createEventBus();
const entries = [];
hub.on('audit', (payload) => {
    entries.unshift(payload.action);
    if (entries.length > 50)
        entries.length = 50;
});
export function recentAudit() {
    return [...entries];
}
