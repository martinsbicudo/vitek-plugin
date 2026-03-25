export type TaskStatus = 'todo' | 'doing' | 'done';

export type Team = { id: string; name: string };

export type Task = {
  id: string;
  teamId: string;
  title: string;
  status: TaskStatus;
  assignee?: string;
  createdAt: string;
};

export type ActivityEntry = { at: string; action: string; detail: string };

const teams: Team[] = [
  { id: 'eng', name: 'Engineering' },
  { id: 'product', name: 'Product' },
];

const tasks: Task[] = [
  {
    id: 't1',
    teamId: 'eng',
    title: 'Ship OpsBoard showcase',
    status: 'doing',
    assignee: 'alice',
    createdAt: new Date().toISOString(),
  },
];

const activity: ActivityEntry[] = [
  {
    at: tasks[0].createdAt,
    action: 'task.created',
    detail: 't1: Ship OpsBoard showcase',
  },
];

let nextTaskId = 2;

export function listTeams(): Team[] {
  return [...teams];
}

export function getTeam(id: string): Team | undefined {
  return teams.find((t) => t.id === id);
}

export function listTasksForTeam(teamId: string, status?: string): Task[] {
  return tasks.filter((t) => {
    if (t.teamId !== teamId) return false;
    if (status && t.status !== status) return false;
    return true;
  });
}

export function getTask(id: string): Task | undefined {
  return tasks.find((t) => t.id === id);
}

export function createTask(input: {
  teamId: string;
  title: string;
  assignee?: string;
}): Task {
  const team = getTeam(input.teamId);
  if (!team) {
    throw new Error('Team not found');
  }
  const id = `t${nextTaskId++}`;
  const task: Task = {
    id,
    teamId: input.teamId,
    title: input.title,
    status: 'todo',
    assignee: input.assignee,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  activity.unshift({
    at: task.createdAt,
    action: 'task.created',
    detail: `${id}: ${task.title}`,
  });
  if (activity.length > 50) activity.length = 50;
  return task;
}

export function listActivity(limit = 20): ActivityEntry[] {
  return activity.slice(0, limit);
}

export function adminSummary() {
  const byStatus: Record<TaskStatus, number> = { todo: 0, doing: 0, done: 0 };
  for (const t of tasks) {
    byStatus[t.status]++;
  }
  return {
    teams: teams.length,
    tasks: tasks.length,
    byStatus,
  };
}
