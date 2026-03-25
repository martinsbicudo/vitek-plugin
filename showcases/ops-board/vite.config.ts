import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vitek } from 'vitek-plugin/plugin';

export default defineConfig({
  plugins: [
    react(),
    vitek({
      openApi: {
        info: {
          title: 'OpsBoard API',
          version: '1.0.0',
          description: 'Showcase: teams, tasks, activity, and admin summary with Vitek file-based routes.',
        },
        servers: [{ url: 'http://localhost:5173', description: 'Development' }],
      },
    }),
  ],
});
