import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import {
  normalizeImporterPath,
  normalizeModuleIdPath,
  resolveWithExtension,
} from './path-utils.js';

describe('path-utils', () => {
  let rootDir: string;

  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(process.cwd(), 'path-utils-test-'));
    fs.mkdirSync(path.join(rootDir, 'src', 'api'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'src', 'lib'), { recursive: true });
    fs.writeFileSync(path.join(rootDir, 'src', 'api', 'health.ts'), '', 'utf-8');
    fs.writeFileSync(path.join(rootDir, 'src', 'lib', 'utils.ts'), '', 'utf-8');
  });

  afterEach(() => {
    try {
      fs.rmSync(rootDir, { recursive: true });
    } catch {
      // ignore
    }
  });

  describe('normalizeImporterPath', () => {
    it('converts file: URL to absolute path', () => {
      const filePath = path.join(rootDir, 'src', 'api', 'health.ts');
      const fileUrl = pathToFileURL(filePath).href;
      expect(normalizeImporterPath(fileUrl, rootDir)).toBe(filePath);
    });

    it('converts leading-slash path (virtual) when file exists', () => {
      const virtualPath = '/src/api/health.ts';
      const result = normalizeImporterPath(virtualPath, rootDir);
      expect(result).toBe(path.join(rootDir, 'src', 'api', 'health.ts'));
    });

    it('converts leading-slash path when file does not exist', () => {
      const virtualPath = '/nonexistent/file.ts';
      const result = normalizeImporterPath(virtualPath, rootDir);
      expect(result).toBe(path.resolve(virtualPath));
    });

    it('resolves absolute path', () => {
      const absPath = path.join(rootDir, 'src', 'api', 'health.ts');
      expect(normalizeImporterPath(absPath, rootDir)).toBe(path.resolve(absPath));
    });
  });

  describe('normalizeModuleIdPath', () => {
    it('converts file: URL to absolute path', () => {
      const filePath = path.join(rootDir, 'src', 'lib', 'utils.ts');
      const fileUrl = pathToFileURL(filePath).href;
      expect(normalizeModuleIdPath(fileUrl, rootDir)).toBe(filePath);
    });

    it('converts leading-slash path (virtual) when file exists', () => {
      const virtualPath = '/src/lib/utils.ts';
      const result = normalizeModuleIdPath(virtualPath, rootDir);
      expect(result).toBe(path.join(rootDir, 'src', 'lib', 'utils.ts'));
    });

    it('resolves path without leading slash', () => {
      const relPath = path.join(rootDir, 'src', 'api', 'health.ts');
      expect(normalizeModuleIdPath(relPath, rootDir)).toBe(path.resolve(relPath));
    });
  });

  describe('resolveWithExtension', () => {
    it('returns path when file exists without extension', () => {
      const existingPath = path.join(rootDir, 'src', 'api', 'health.ts');
      expect(resolveWithExtension(existingPath)).toBe(existingPath);
    });

    it('adds .ts when file exists with extension', () => {
      const basePath = path.join(rootDir, 'src', 'api', 'health');
      expect(resolveWithExtension(basePath)).toBe(basePath + '.ts');
    });

    it('adds .tsx when .ts does not exist but .tsx does', () => {
      fs.writeFileSync(path.join(rootDir, 'src', 'component.tsx'), '', 'utf-8');
      const basePath = path.join(rootDir, 'src', 'component');
      expect(resolveWithExtension(basePath)).toBe(basePath + '.tsx');
    });

    it('returns null when file does not exist', () => {
      const basePath = path.join(rootDir, 'src', 'nonexistent');
      expect(resolveWithExtension(basePath)).toBeNull();
    });
  });
});
