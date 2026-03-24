import { InMemoryLockProvider } from './in-memory-lock.js';
import type {
  ScheduleDefinition,
  ScheduleRunResult,
  SchedulerLockProvider,
  TaskRunResult,
} from './types.js';

export interface RunScheduleOptions {
  lockProvider?: SchedulerLockProvider;
}

export async function runScheduleOnce(
  definition: ScheduleDefinition,
  options: RunScheduleOptions = {}
): Promise<ScheduleRunResult> {
  const lockProvider = options.lockProvider ?? new InMemoryLockProvider();
  const results: TaskRunResult[] = [];

  for (const task of definition.tasks) {
    const release = await lockProvider.acquire(task.name);
    if (!release) {
      results.push({
        name: task.name,
        cron: task.cron,
        ok: false,
        error: 'Task lock not acquired',
      });
      continue;
    }
    try {
      await Promise.resolve(task.run());
      results.push({
        name: task.name,
        cron: task.cron,
        ok: true,
      });
    } catch (error) {
      results.push({
        name: task.name,
        cron: task.cron,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      release();
    }
  }

  return { tasks: results };
}
