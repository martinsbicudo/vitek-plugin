import { defineSchedule } from 'vitek-plugin/scheduler';

export default defineSchedule({
  tasks: [
    {
      name: 'demo-task',
      cron: '0 0 * * *',
      run: async () => {},
    },
  ],
});
