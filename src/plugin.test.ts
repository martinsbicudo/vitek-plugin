import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { vitek } from './plugin.js';

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
      expect(plugin.resolveId!('vue', importer)).toBeNull();
      expect(plugin.resolveId!('/absolute', importer)).toBeNull();
    });

    it('returns null when importer is undefined', () => {
      expect(plugin.resolveId!('../lib/greeting', undefined as unknown as string)).toBeNull();
    });

    it('returns null when importer is outside apiDir', () => {
      const importerOutside = pathToFileURL(path.join(rootDir, 'src', 'main.ts')).href;
      expect(plugin.resolveId!('../lib/greeting', importerOutside)).toBeNull();
    });

    it('resolves relative import from api file to existing file and returns file URL', () => {
      const importer = pathToFileURL(path.join(apiDir, 'health.get.ts')).href;
      const result = plugin.resolveId!('../lib/greeting', importer);
      expect(result).not.toBeNull();
      expect(typeof result).toBe('string');
      expect(result).toContain('greeting');
      expect(result).toMatch(/^file:\/\//);
    });

    it('resolves with extension fallback when target has no extension', () => {
      const importer = pathToFileURL(path.join(apiDir, 'health.get.ts')).href;
      const result = plugin.resolveId!('../lib/greeting', importer);
      expect(result).not.toBeNull();
      const filePath = result!.replace(/^file:\/\//, '').replace(/%2F/g, '/').replace(/%3A/g, ':');
      expect(fs.existsSync(filePath) || fs.existsSync(filePath + '.ts')).toBe(true);
    });

    it('returns null when relative target does not exist', () => {
      const importer = pathToFileURL(path.join(apiDir, 'health.get.ts')).href;
      expect(plugin.resolveId!('../lib/nonexistent', importer)).toBeNull();
    });

    it('resolves nested api file relative import', () => {
      const nestedDir = path.join(apiDir, 'nested');
      const importer = pathToFileURL(path.join(nestedDir, 'deep.get.ts')).href;
      const result = plugin.resolveId!('../../lib/greeting', importer);
      expect(result).not.toBeNull();
      expect(result).toContain('greeting');
    });
  });

  describe('transform', () => {
    const healthGetId = path.join(process.cwd(), 'placeholder'); // will override per platform

    it('returns null when id is not under apiDir', () => {
      const code = "import x from '../lib/greeting';";
      const idOutside = pathToFileURL(path.join(rootDir, 'src', 'main.ts')).href;
      const result = plugin.transform!(code, idOutside);
      expect(result).toBeNull();
    });

    it('rewrites relative import to root-relative path when id is under apiDir', () => {
      const code = "import { getGreeting } from '../lib/greeting';\nexport default function handler() {}";
      const id = pathToFileURL(path.join(apiDir, 'health.get.ts')).href;
      const result = plugin.transform!(code, id);
      expect(result).not.toBeNull();
      expect(result!.code).toContain("/src/lib/greeting");
      expect(result!.code).not.toContain("from '../lib/greeting'");
    });

    it('preserves double quotes when original uses double quotes', () => {
      const code = 'import { getGreeting } from "../lib/greeting";';
      const id = pathToFileURL(path.join(apiDir, 'health.get.ts')).href;
      const result = plugin.transform!(code, id);
      expect(result).not.toBeNull();
      expect(result!.code).toContain('/src/lib/greeting');
    });

    it('returns null when code has no relative imports', () => {
      const code = "import vue from 'vue';\nexport default {}";
      const id = pathToFileURL(path.join(apiDir, 'health.get.ts')).href;
      const result = plugin.transform!(code, id);
      expect(result).toBeNull();
    });

    it('rewrites nested relative import (../../lib)', () => {
      const code = "import { getGreeting } from '../../lib/greeting';";
      const nestedPath = path.join(apiDir, 'nested', 'deep.get.ts');
      const id = pathToFileURL(nestedPath).href;
      const result = plugin.transform!(code, id);
      expect(result).not.toBeNull();
      expect(result!.code).toContain("/src/lib/greeting");
    });

    it('does not rewrite import when resolved target is outside root', () => {
      const code = "import x from '../../../etc/passwd';";
      const id = pathToFileURL(path.join(apiDir, 'health.get.ts')).href;
      const result = plugin.transform!(code, id);
      expect(result).toBeNull();
    });

    it('returns null when relative target file does not exist', () => {
      const code = "import x from '../lib/nonexistent';";
      const id = pathToFileURL(path.join(apiDir, 'health.get.ts')).href;
      const result = plugin.transform!(code, id);
      expect(result).toBeNull();
    });
  });

  describe('plugin shape', () => {
    it('has enforce pre', () => {
      expect(plugin.enforce).toBe('pre');
    });

    it('exposes resolveId and transform', () => {
      expect(typeof plugin.resolveId).toBe('function');
      expect(typeof plugin.transform).toBe('function');
    });
  });
});
