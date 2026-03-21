import { defineConfig } from 'vite';
import { vitek } from 'vitek-plugin/plugin';

export default defineConfig({
  plugins: [
    vitek({
      cors: true,
      onError(err, _req, res) {
        console.error('[API Error]', err.message);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      },
    }),
  ],
});
