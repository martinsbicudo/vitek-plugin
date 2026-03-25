import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vitek } from 'vitek-plugin/plugin';

export default defineConfig({
  plugins: [
    react(),
    vitek({
      openApi: {
        info: {
          title: 'StockPulse API',
          version: '1.0.0',
          description:
            'Showcase: inventory levels, stock movements, and low-stock alerts over WebSockets (OpenAPI + AsyncAPI).',
        },
        servers: [{ url: 'http://localhost:5173', description: 'Development' }],
      },
    }),
  ],
});
