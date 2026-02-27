import { describe, it, expect } from 'vitest';
import { suggestViteConfig } from './suggest-vite-config.js';

describe('suggestViteConfig', () => {
  it('returns minimal config when no options', () => {
    const out = suggestViteConfig();
    expect(out).toContain('defineConfig');
    expect(out).toContain('vitek');
    expect(out).toContain('vitek-plugin');
    expect(out).not.toContain('apiDir');
  });

  it('includes apiDir when provided', () => {
    const out = suggestViteConfig({ apiDir: 'lib/api' });
    expect(out).toContain('apiDir: "lib/api"');
  });

  it('includes openApi: true when true', () => {
    const out = suggestViteConfig({ openApi: true });
    expect(out).toContain('openApi: true');
  });

  it('includes cors when true', () => {
    const out = suggestViteConfig({ cors: true });
    expect(out).toContain('cors: true');
  });

  it('includes sockets path when provided', () => {
    const out = suggestViteConfig({ sockets: { path: '/ws' } });
    expect(out).toContain('sockets: { path: "/ws" }');
  });

  it('includes sockets: false when false', () => {
    const out = suggestViteConfig({ sockets: false });
    expect(out).toContain('sockets: false');
  });
});
