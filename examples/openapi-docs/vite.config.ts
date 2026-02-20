import { defineConfig } from 'vite';
import { vitek } from 'vitek-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitek({
      // Enable OpenAPI/Swagger documentation
      openApi: {
        info: {
          title: 'Vitek OpenAPI Example',
          version: '1.0.0',
          description: 'Example API demonstrating automatic OpenAPI/Swagger documentation generation with Vitek',
        },
        servers: [
          {
            url: 'http://localhost:5173',
            description: 'Development server',
          },
        ],
      },
    }),
  ],
});
