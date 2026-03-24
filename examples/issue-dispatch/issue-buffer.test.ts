import { describe, it, expect } from 'vitest';
import { createBufferingIssueDispatcher, getRecentIssues } from './src/lib/issue-buffer';

describe('issue-dispatch example buffer', () => {
  it('custom dispatcher records events for issues list', () => {
    const id = `evt-${Date.now()}`;
    const dispatcher = createBufferingIssueDispatcher();
    dispatcher.dispatch({
      id,
      timestamp: new Date().toISOString(),
      severity: 'info',
      source: 'manual',
      title: 'Buffered test',
      message: 'from unit test',
    });
    const issues = getRecentIssues();
    expect(issues.some((e) => e.id === id && e.title === 'Buffered test')).toBe(true);
  });
});
