import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vitek } from 'vitek-plugin';

export default defineConfig({
  plugins: [
    react(),
    vitek({
      // Enable OpenAPI/Swagger documentation
      openApi: {
        info: {
          title: 'TypeScript React Example API',
          version: '1.0.0',
          description: 'Example API demonstrating Vitek features with React',
        },
        servers: [
          { url: 'http://localhost:5173', description: 'Development server' },
        ],
      },
    }),
  ],
});
