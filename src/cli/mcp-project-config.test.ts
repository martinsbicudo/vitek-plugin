import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadMcpConfig } from './mcp-project-config.js';

describe('loadMcpConfig', () => {
  it('returns default config when vitek.mcp.json does not exist', () => {
    const root = os.tmpdir();
    const config = loadMcpConfig(root);
    expect(config.apiDir).toBe('src/api');
    expect(config.apiBasePath).toBe('/api');
    expect(config.socketBasePath).toBe('/api/ws');
    expect(config.baseUrl).toBe('http://localhost:5173');
  });

  it('reads apiDir and baseUrl from vitek.mcp.json', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-mcp-test-'));
    try {
      fs.writeFileSync(
        path.join(root, 'vitek.mcp.json'),
        JSON.stringify({ apiDir: 'lib/api', baseUrl: 'http://localhost:3000' }),
        'utf-8'
      );
      const config = loadMcpConfig(root);
      expect(config.apiDir).toBe('lib/api');
      expect(config.baseUrl).toBe('http://localhost:3000');
      expect(config.apiBasePath).toBe('/api');
    } finally {
      fs.rmSync(root, { recursive: true });
    }
  });

  it('returns default config when vitek.mcp.json is invalid JSON', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitek-mcp-invalid-'));
    try {
      fs.writeFileSync(path.join(root, 'vitek.mcp.json'), 'not json', 'utf-8');
      const config = loadMcpConfig(root);
      expect(config.apiDir).toBe('src/api');
    } finally {
      fs.rmSync(root, { recursive: true });
    }
  });
});
