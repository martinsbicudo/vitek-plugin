import type { IssueDispatcher, IssueEvent } from 'vitek-plugin';

const storeKey = Symbol.for('vitek.showcase.reliable-api.issues');

type Store = { items: IssueEvent[] };

function getStore(): Store {
  const g = globalThis as unknown as Record<symbol, Store | undefined>;
  if (!g[storeKey]) g[storeKey] = { items: [] };
  return g[storeKey]!;
}

export function getRecentIssues(): IssueEvent[] {
  return [...getStore().items];
}

export function createBufferingIssueDispatcher(): IssueDispatcher {
  return {
    dispatch(event: IssueEvent) {
      const { items } = getStore();
      items.unshift(event);
      if (items.length > 40) items.length = 40;
    },
  };
}
