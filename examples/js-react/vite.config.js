import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vitek } from 'vitek-plugin';

export default defineConfig({
  plugins: [
    react(),
    vitek(),
  ],
});
