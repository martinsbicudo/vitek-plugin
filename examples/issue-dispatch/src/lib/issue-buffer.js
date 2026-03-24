const storeKey = Symbol.for('vitek.examples.issue-dispatch.events');
function getStore() {
    const g = globalThis;
    if (!g[storeKey])
        g[storeKey] = { items: [] };
    return g[storeKey];
}
const maxItems = 40;
export function getRecentIssues() {
    return [...getStore().items];
}
export function createBufferingIssueDispatcher() {
    return {
        dispatch(event) {
            const { items } = getStore();
            items.unshift(event);
            if (items.length > maxItems)
                items.length = maxItems;
            const hint = event.suggestions && event.suggestions.length > 0
                ? ` suggestions: ${event.suggestions.map((s) => s.title).join(' | ')}`
                : '';
            console.log(`[vitek issue] ${event.severity} ${event.title} — ${event.message}${hint}`);
        },
    };
}
