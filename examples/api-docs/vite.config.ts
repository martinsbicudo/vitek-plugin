import { defineConfig } from 'vite';
import { vitek } from 'vitek-plugin/plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vitek({
      // Enable OpenAPI/Swagger documentation
      // All fields are optional - uses sensible defaults
      openApi: {
        info: {
          title: 'Vitek API Docs Example',
          version: '1.0.0',
          description: 'Example API demonstrating automatic OpenAPI/Swagger documentation generation with Vitek',
        },
        // servers is optional - defaults to current URL
        servers: [
          {
            url: 'http://localhost:5173',
            description: 'Development server',
          },
        ],
      },
      // You can also use: openApi: true (uses all defaults)
      // Or just: openApi: {} (uses defaults for everything)
    }),
  ],
});
