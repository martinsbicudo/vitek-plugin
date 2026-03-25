import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vitek } from 'vitek-plugin/plugin';
import type { VitekPlugin } from 'vitek-plugin';
import { recordApiRequest } from './src/lib/api-metrics.js';
import { createBufferingIssueDispatcher } from './src/lib/issue-buffer.js';

const issueDispatcher = createBufferingIssueDispatcher();

const apiMetricsPlugin: VitekPlugin = {
  name: 'reliable-api-metrics',
  beforeApiRequest(ctx) {
    recordApiRequest();
    ctx.next();
  },
};

const apiVersionPlugin: VitekPlugin = {
  name: 'reliable-api-version-header',
  beforeApiRequest(ctx) {
    ctx.res.setHeader('X-API-Version', '1');
    ctx.next();
  },
};

export default defineConfig({
  plugins: [
    react(),
    vitek({
      openApi: {
        info: {
          title: 'ReliableAPI',
          version: '1.0.0',
          description:
            'Showcase: strict CORS, body limits, trustProxy, onError, platform observability + issue dispatch, withSpan.',
        },
        servers: [{ url: 'http://localhost:5173', description: 'Development' }],
      },
      sockets: false,
      cors: {
        origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
        methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Accept', 'X-Internal-Token'],
        exposeHeaders: ['X-Request-Id', 'X-API-Version'],
      },
      maxBodySize: 4096,
      trustProxy: true,
      issueDispatcher,
      plugins: [apiMetricsPlugin, apiVersionPlugin],
      onError(err, req, res) {
        if (res.writableEnded) return;
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'dev_on_error', detail: err.message }));
      },
    }),
  ],
});
