export interface ViteConfigOptions {
  openApi?: boolean;
  cors?: boolean;
  apiDir?: string;
  apiBasePath?: string;
  sockets?: boolean | { path?: string };
}

export function suggestViteConfig(options: ViteConfigOptions = {}): string {
  const opts: string[] = [];
  if (options.apiDir != null) opts.push(`apiDir: "${options.apiDir}"`);
  if (options.apiBasePath != null) opts.push(`apiBasePath: "${options.apiBasePath}"`);
  if (options.openApi === true) opts.push('openApi: true');
  else if (typeof options.openApi === 'object') opts.push('openApi: {}');
  if (options.cors === true) opts.push('cors: true');
  else if (typeof options.cors === 'object') opts.push('cors: { origin: "https://your-frontend.com" }');
  if (options.sockets === false) opts.push('sockets: false');
  else if (typeof options.sockets === 'object' && options.sockets?.path)
    opts.push(`sockets: { path: "${options.sockets.path}" }`);

  const optionsStr = opts.length ? `,\n    ${opts.join(',\n    ')}` : '';

  return `import { defineConfig } from "vite";
import { vitek } from "vitek-plugin";

export default defineConfig({
  plugins: [
    vitek({${optionsStr}
    }),
  ],
});
`;
}
