export interface ScheduleTask {
  name: string;
  cron: string;
  run: () => void | Promise<void>;
}

export interface ScheduleDefinition {
  tasks: ScheduleTask[];
}

export interface TaskRunResult {
  name: string;
  cron: string;
  ok: boolean;
  error?: string;
}

export interface ScheduleRunResult {
  tasks: TaskRunResult[];
}

export interface SchedulerLockProvider {
  acquire(taskName: string): Promise<(() => void) | null>;
}
