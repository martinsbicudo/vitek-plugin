# Events and Scheduler

Vitek now includes a baseline event bus and schedule runner for internal orchestration.

## Event bus

Create an in-memory typed bus:

```ts
import { createEventBus } from 'vitek-plugin/events';

type AppEvents = {
  'user.created': { userId: string };
  'billing.failed': { invoiceId: string };
};

const bus = createEventBus<AppEvents>();

bus.on('user.created', async (payload) => {
  console.log('welcome flow', payload.userId);
});

await bus.emit('user.created', { userId: 'u1' });
```

## Scheduler API

Define a schedule file:

```ts
import { defineSchedule } from 'vitek-plugin/scheduler';

export default defineSchedule({
  tasks: [
    {
      name: 'cleanup.sessions',
      cron: '0 */6 * * *',
      run: async () => {
        console.log('cleanup');
      },
    },
  ],
});
```

Run once from CLI:

```bash
vitek schedule run --file vitek.schedule.mjs
vitek schedule run --file vitek.schedule.mjs --json
```

## Locking

`runScheduleOnce` uses an in-memory lock provider by default (`InMemoryLockProvider`). It prevents duplicate execution within the same process.

For multi-instance deployments, provide a custom `SchedulerLockProvider` implementation (Redis or equivalent).
