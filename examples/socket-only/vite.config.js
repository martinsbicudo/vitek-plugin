import { defineConfig } from 'vite';
import { vitek } from 'vitek-plugin/plugin';

export default defineConfig({
  plugins: [vitek({
    logging: {
      enableRequestLogging: true
    }
  })],
});
