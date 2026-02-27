import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { watchApiDirectory } from './watch-api-dir.js';

describe('watch-api-dir', () => {
  let tmpDir: string;
  let apiDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(process.cwd(), 'watch-api-'));
    apiDir = path.join(tmpDir, 'api');
    fs.mkdirSync(apiDir, { recursive: true });
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true });
    } catch {
      // ignore
    }
  });

  it('returns watcher with no-op close when apiDir does not exist', () => {
    const watcher = watchApiDirectory(
      path.join(tmpDir, 'nonexistent'),
      () => {}
    );
    expect(watcher).toBeDefined();
    expect(typeof watcher.close).toBe('function');
    watcher.close();
  });

  it('returns watcher with close when apiDir exists', () => {
    const watcher = watchApiDirectory(apiDir, () => {});
    expect(watcher).toBeDefined();
    expect(typeof watcher.close).toBe('function');
    watcher.close();
  });

  it('accepts debounceMs option', () => {
    const watcher = watchApiDirectory(apiDir, () => {}, { debounceMs: 100 });
    expect(watcher).toBeDefined();
    watcher.close();
  });
});
