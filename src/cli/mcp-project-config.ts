import * as fs from 'fs';
import * as path from 'path';

export interface VitekMcpConfig {
  apiDir: string;
  apiBasePath: string;
  socketBasePath: string;
  baseUrl: string;
}

const DEFAULT_CONFIG: VitekMcpConfig = {
  apiDir: 'src/api',
  apiBasePath: '/api',
  socketBasePath: '/api/ws',
  baseUrl: 'http://localhost:5173',
};

export function loadMcpConfig(root: string): VitekMcpConfig {
  const configPath = path.join(root, 'vitek.mcp.json');
  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return {
      apiDir: raw.apiDir ?? DEFAULT_CONFIG.apiDir,
      apiBasePath: raw.apiBasePath ?? DEFAULT_CONFIG.apiBasePath,
      socketBasePath: raw.socketBasePath ?? DEFAULT_CONFIG.socketBasePath,
      baseUrl: raw.baseUrl ?? DEFAULT_CONFIG.baseUrl,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
