import type { IssueDispatcher, IssueEvent } from 'vitek-plugin';

const storeKey = Symbol.for('vitek.examples.issue-dispatch.events');

type Store = { items: IssueEvent[] };

function getStore(): Store {
  const g = globalThis as unknown as Record<symbol, Store | undefined>;
  if (!g[storeKey]) g[storeKey] = { items: [] };
  return g[storeKey]!;
}

const maxItems = 40;

export function getRecentIssues(): IssueEvent[] {
  return [...getStore().items];
}

export function createBufferingIssueDispatcher(): IssueDispatcher {
  return {
    dispatch(event: IssueEvent) {
      const { items } = getStore();
      items.unshift(event);
      if (items.length > maxItems) items.length = maxItems;
      const hint =
        event.suggestions && event.suggestions.length > 0
          ? ` suggestions: ${event.suggestions.map((s) => s.title).join(' | ')}`
          : '';
      console.log(`[vitek issue] ${event.severity} ${event.title} — ${event.message}${hint}`);
    },
  };
}
