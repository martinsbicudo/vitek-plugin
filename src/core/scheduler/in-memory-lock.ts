import type { SchedulerLockProvider } from './types.js';

export class InMemoryLockProvider implements SchedulerLockProvider {
  private readonly locks = new Set<string>();

  async acquire(taskName: string): Promise<(() => void) | null> {
    if (this.locks.has(taskName)) {
      return null;
    }
    this.locks.add(taskName);
    return () => {
      this.locks.delete(taskName);
    };
  }
}
