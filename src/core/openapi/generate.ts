import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_OPENAPI_INFO, type RouteForDocs, type OpenApiOptions } from './types.js';
import { buildPaths, buildSchemas } from './spec-builder.js';

export type { RouteForDocs, OpenApiInfo, OpenApiServer, OpenApiOptions, RouteMetadata, ResponseMetadata, ApiDocsHtmlOptions } from './types.js';

export function generateOpenApiSpec(routes: RouteForDocs[], options: OpenApiOptions): object {
  const info = { ...DEFAULT_OPENAPI_INFO, ...options.info };

  const spec: Record<string, unknown> = {
    openapi: '3.0.3',
    info,
    paths: buildPaths(routes, options),
    components: {
      schemas: buildSchemas(routes),
    },
  };

  if (options.servers && options.servers.length > 0) {
    spec.servers = options.servers;
  }

  return spec;
}

export async function generateOpenApiFile(
  outputPath: string,
  routes: RouteForDocs[],
  options: OpenApiOptions
): Promise<void> {
  const spec = generateOpenApiSpec(routes, options);

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2), 'utf-8');
}

export function generateSwaggerUiHtml(apiJsonPath: string, title: string = 'API Documentation'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '${escapeHtml(apiJsonPath)}',
      dom_id: '#swagger-ui',
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.presets.standalone
      ]
    });
  </script>
</body>
</html>`;
}

export function generateApiDocsHtml(
  openApiJsonPath: string,
  title: string,
  options: import('./types.js').ApiDocsHtmlOptions = {}
): string {
  const hasAsyncApi = Boolean(options.asyncApiJsonPath?.trim());
  const asyncApiPath = options.asyncApiJsonPath ?? '';

  if (!hasAsyncApi) {
    return generateSwaggerUiHtml(openApiJsonPath, title);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
  <link rel="stylesheet" href="https://unpkg.com/@asyncapi/react-component@1.0.0-next.39/styles/default.min.css">
  <style>
    .vitek-docs-tabs { display: flex; gap: 0; border-bottom: 1px solid #ddd; margin-bottom: 0; padding: 0 1rem; background: #fafafa; }
    .vitek-docs-tab { padding: 0.75rem 1.25rem; cursor: pointer; font-weight: 500; color: #666; border-bottom: 2px solid transparent; margin-bottom: -1px; }
    .vitek-docs-tab:hover { color: #333; }
    .vitek-docs-tab.active { color: #4990e2; border-bottom-color: #4990e2; }
    .vitek-docs-panel { display: none; padding: 0; height: calc(100vh - 50px); }
    .vitek-docs-panel.active { display: block; }
    .vitek-docs-panel iframe { border: none; width: 100%; height: 100%; }
    #asyncapi-ui { padding: 1rem; min-height: 100%; box-sizing: border-box; }
  </style>
</head>
<body>
  <div class="vitek-docs-tabs">
    <div class="vitek-docs-tab active" data-tab="rest">REST</div>
    <div class="vitek-docs-tab" data-tab="websockets">WebSockets</div>
  </div>
  <div id="panel-rest" class="vitek-docs-panel active">
    <div id="swagger-ui"></div>
  </div>
  <div id="panel-websockets" class="vitek-docs-panel">
    <div id="asyncapi-ui"></div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '${escapeHtml(openApiJsonPath)}',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.presets.standalone]
    });
  </script>
  <script src="https://unpkg.com/@asyncapi/react-component@1.0.0-next.39/browser/standalone/index.js"></script>
  <script>
    (function() {
      var tabs = document.querySelectorAll('.vitek-docs-tab');
      var panels = document.querySelectorAll('.vitek-docs-panel');
      var asyncApiLoaded = false;
      var asyncApiPath = '${escapeHtml(asyncApiPath)}';
      function showTab(name) {
        tabs.forEach(function(t) { t.classList.toggle('active', t.getAttribute('data-tab') === name); });
        panels.forEach(function(p) {
          var isActive = (p.id === 'panel-' + name);
          p.classList.toggle('active', isActive);
          if (isActive && name === 'websockets' && !asyncApiLoaded && typeof AsyncApiStandalone !== 'undefined') {
            asyncApiLoaded = true;
            fetch(asyncApiPath).then(function(r) { return r.text(); }).then(function(schema) {
              AsyncApiStandalone.render({ schema: schema, config: { show: { sidebar: true } } }, document.getElementById('asyncapi-ui'));
            }).catch(function(err) { document.getElementById('asyncapi-ui').innerHTML = '<p>Failed to load AsyncAPI spec: ' + err.message + '</p>'; });
          }
        });
      }
      tabs.forEach(function(t) { t.addEventListener('click', function() { showTab(t.getAttribute('data-tab')); }); });
    })();
  </script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
