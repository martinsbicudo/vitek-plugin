import type { IssueDispatcher, IssueEvent } from './types.js';

export function createNoopIssueDispatcher(): IssueDispatcher {
  return {
    dispatch(_event: IssueEvent): void {},
  };
}

export function createConsoleIssueDispatcher(): IssueDispatcher {
  return {
    dispatch(event: IssueEvent): void {
      console.log(
        JSON.stringify({
          component: 'vitek',
          event: 'issue.dispatch',
          ...event,
        })
      );
    },
  };
}
