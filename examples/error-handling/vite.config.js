import { defineConfig } from 'vite';
import { vitek } from 'vitek-plugin/plugin';

export default defineConfig({
  plugins: [
    vitek({
      onError(err, _req, res) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Service Unavailable', message: err.message }));
      },
    }),
  ],
});