import { defineConfig } from 'vite';
import { vitek } from 'vitek-plugin';

export default defineConfig({
  plugins: [
    vitek({
      cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
      },
    }),
  ],
});