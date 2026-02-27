import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import type { Plugin } from 'vite';
import { vitek } from './plugin.js';

function callResolveId(plugin: Plugin, id: string, importer: string | undefined): string | null {
  const hook = plugin.resolveId;
  if (!hook) return null;
  const fn = typeof hook === 'function' ? hook : (hook as { handler: (id: string, importer: string | undefined, options: unknown) => string | null }).handler;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return fn.call(null as any, id, importer, { attributes: {}, isEntry: false }) as string | null;
}

function callTransform(plugin: Plugin, code: string, id: string): { code: string; map: null } | null {
  const hook = plugin.transform;
  if (!hook) return null;
  const fn = typeof hook === 'function' ? hook : (hook as { handler: (code: string, id: string) => { code: string; map: null } | null }).handler;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return fn.call(null as any, code, id) as { code: string; map: null } | null;
}

describe('vitek plugin resolveId and transform', () => {
  let plugin: ReturnType<typeof vitek>;
  let rootDir: string;
  let apiDir: string;

  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(process.cwd(), 'vitek-plugin-test-'));
    apiDir = path.join(rootDir, 'src', 'api');
    fs.mkdirSync(path.join(apiDir), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'src', 'lib'), { recursive: true });
    fs.writeFileSync(
      path.join(rootDir, 'src', 'api', 'health.get.ts'),
      "import { getGreeting } from '../lib/greeting';\nexport default function handler() { return { ok: true }; }\n",
      'utf-8'
    );
    fs.writeFileSync(
      path.join(rootDir, 'src', 'lib', 'greeting.ts'),
      "export function getGreeting() { return 'hi'; }\n",
      'utf-8'
    );
    fs.mkdirSync(path.join(rootDir, 'src', 'api', 'nested'), { recursive: true });
    fs.writeFileSync(
      path.join(rootDir, 'src', 'api', 'nested', 'deep.get.ts'),
      "import { getGreeting } from '../../lib/greeting';\nexport default function handler() { return {}; }\n",
      'utf-8'
    );
    plugin = vitek({ apiDir: path.join('src', 'api') });
    (plugin as { configResolved?: (config: { root: string; build?: { outDir: string } }) => void }).configResolved?.({
      root: rootDir,
      build: { outDir: 'dist' },
    });
  });

  afterEach(() => {
    try {
      fs.rmSync(rootDir, { recursive: true });
    } catch {
      // ignore
    }
  });

  describe('resolveId', () => {
    it('returns null when id does not start with .', () => {
      const importer = pathToFileURL(path.join(apiDir, 'health.get.ts')).href;
      expect(callResolveId(plugin, 'vue', importer)).toBeNull();
      expect(callResolveId(plugin, '/absolute', importer)).toBeNull();
    });

    it('returns null when importer is undefined', () => {
      expect(callResolveId(plugin, '../lib/greeting', undefined)).toBeNull();
    });

    it('returns null when importer is outside apiDir', () => {
      const importerOutside = pathToFileURL(path.join(rootDir, 'src', 'main.ts')).href;
      expect(callResolveId(plugin, '../lib/greeting', importerOutside)).toBeNull();
    });

    it('resolves relative import from api file to existing file and returns file URL', () => {
      const importer = pathToFileURL(path.join(apiDir, 'health.get.ts')).href;
      const result = callResolveId(plugin, '../lib/greeting', importer);
      expect(result).not.toBeNull();
      expect(typeof result).toBe('string');
      expect(result).toContain('greeting');
      expect(result).toMatch(/^file:\/\//);
    });

    it('resolves with extension fallback when target has no extension', () => {
      const importer = pathToFileURL(path.join(apiDir, 'health.get.ts')).href;
      const result = callResolveId(plugin, '../lib/greeting', importer);
      expect(result).not.toBeNull();
      const filePath = result!.replace(/^file:\/\//, '').replace(/%2F/g, '/').replace(/%3A/g, ':');
      expect(fs.existsSync(filePath) || fs.existsSync(filePath + '.ts')).toBe(true);
    });

    it('returns null when relative target does not exist', () => {
      const importer = pathToFileURL(path.join(apiDir, 'health.get.ts')).href;
      expect(callResolveId(plugin, '../lib/nonexistent', importer)).toBeNull();
    });

    it('resolves nested api file relative import', () => {
      const nestedDir = path.join(apiDir, 'nested');
      const importer = pathToFileURL(path.join(nestedDir, 'deep.get.ts')).href;
      const result = callResolveId(plugin, '../../lib/greeting', importer);
      expect(result).not.toBeNull();
      expect(result).toContain('greeting');
    });
  });

  describe('transform', () => {
    it('returns null when id is not under src', () => {
      const code = "import x from '../lib/greeting';";
      fs.mkdirSync(path.join(rootDir, 'other'), { recursive: true });
      const idOutside = pathToFileURL(path.join(rootDir, 'other', 'main.ts')).href;
      const result = callTransform(plugin, code, idOutside);
      expect(result).toBeNull();
    });

    it('rewrites relative import when id is under src/lib (not only api)', () => {
      fs.writeFileSync(
        path.join(rootDir, 'src', 'lib', 'executor.ts'),
        "import { getGreeting } from './greeting';\nexport function run() { return getGreeting(); }\n",
        'utf-8'
      );
      const code = "import { getGreeting } from './greeting';\nexport function run() { return getGreeting(); }\n";
      const id = pathToFileURL(path.join(rootDir, 'src', 'lib', 'executor.ts')).href;
      const result = callTransform(plugin, code, id);
      expect(result).not.toBeNull();
      expect(result!.code).toContain("/src/lib/greeting");
      expect(result!.code).not.toContain("from './greeting'");
    });

    it('rewrites relative import in src/lib file that imports from subpath', () => {
      fs.mkdirSync(path.join(rootDir, 'src', 'lib', 'nested'), { recursive: true });
      fs.writeFileSync(
        path.join(rootDir, 'src', 'lib', 'nested', 'helper.ts'),
        "export function getMessage() { return 'ok'; }\n",
        'utf-8'
      );
      fs.writeFileSync(
        path.join(rootDir, 'src', 'lib', 'nested', 'index.ts'),
        "export { getMessage } from './helper';\n",
        'utf-8'
      );
      const code = "export { getMessage } from './helper';\n";
      const id = pathToFileURL(path.join(rootDir, 'src', 'lib', 'nested', 'index.ts')).href;
      const result = callTransform(plugin, code, id);
      expect(result).not.toBeNull();
      expect(result!.code).toContain("/src/lib/nested/helper");
    });

    it('rewrites relative import to root-relative path when id is under apiDir', () => {
      const code = "import { getGreeting } from '../lib/greeting';\nexport default function handler() {}";
      const id = pathToFileURL(path.join(apiDir, 'health.get.ts')).href;
      const result = callTransform(plugin, code, id);
      expect(result).not.toBeNull();
      expect(result!.code).toContain("/src/lib/greeting");
      expect(result!.code).not.toContain("from '../lib/greeting'");
    });

    it('preserves double quotes when original uses double quotes', () => {
      const code = 'import { getGreeting } from "../lib/greeting";';
      const id = pathToFileURL(path.join(apiDir, 'health.get.ts')).href;
      const result = callTransform(plugin, code, id);
      expect(result).not.toBeNull();
      expect(result!.code).toContain('/src/lib/greeting');
    });

    it('returns null when code has no relative imports', () => {
      const code = "import vue from 'vue';\nexport default {}";
      const id = pathToFileURL(path.join(apiDir, 'health.get.ts')).href;
      const result = callTransform(plugin, code, id);
      expect(result).toBeNull();
    });

    it('rewrites nested relative import (../../lib)', () => {
      const code = "import { getGreeting } from '../../lib/greeting';";
      const nestedPath = path.join(apiDir, 'nested', 'deep.get.ts');
      const id = pathToFileURL(nestedPath).href;
      const result = callTransform(plugin, code, id);
      expect(result).not.toBeNull();
      expect(result!.code).toContain("/src/lib/greeting");
    });

    it('does not rewrite import when resolved target is outside root', () => {
      const code = "import x from '../../../etc/passwd';";
      const id = pathToFileURL(path.join(apiDir, 'health.get.ts')).href;
      const result = callTransform(plugin, code, id);
      expect(result).toBeNull();
    });

    it('returns null when relative target file does not exist', () => {
      const code = "import x from '../lib/nonexistent';";
      const id = pathToFileURL(path.join(apiDir, 'health.get.ts')).href;
      const result = callTransform(plugin, code, id);
      expect(result).toBeNull();
    });
  });

  describe('plugin shape', () => {
    it('has enforce pre', () => {
      expect(plugin.enforce).toBe('pre');
    });

    it('exposes resolveId and transform', () => {
      expect(plugin.resolveId).toBeDefined();
      expect(plugin.transform).toBeDefined();
    });
  });

  describe('buildStart', () => {
    it('generates api.services.ts and api.types.ts when buildStart runs', async () => {
      fs.writeFileSync(path.join(rootDir, 'tsconfig.json'), '{}', 'utf-8');
      const buildStart = (plugin as { buildStart?: () => Promise<void> }).buildStart;
      if (!buildStart) {
        expect.fail('Plugin does not have buildStart hook');
      }
      await buildStart.call(null as never);
      const servicesPath = path.join(rootDir, 'src', 'api.services.ts');
      const typesPath = path.join(rootDir, 'src', 'api.types.ts');
      expect(fs.existsSync(servicesPath)).toBe(true);
      expect(fs.existsSync(typesPath)).toBe(true);
      expect(fs.readFileSync(servicesPath, 'utf-8')).toContain('getHealth');
      expect(fs.readFileSync(typesPath, 'utf-8')).toContain('VitekParams');
    });
  });
});
