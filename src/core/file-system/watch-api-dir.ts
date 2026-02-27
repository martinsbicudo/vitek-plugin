/**
 * API directory watcher
 * Core logic - abstracted to be runtime agnostic
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROUTE_FILE_PATTERN, MIDDLEWARE_FILE_PATTERN } from '../../shared/constants.js';

export type FileChangeEvent = 'add' | 'change' | 'unlink';
export type FileChangeCallback = (event: FileChangeEvent, filePath: string) => void;

export interface WatchApiDirectoryOptions {
  debounceMs?: number;
}

/**
 * Interface for watcher (allows different implementations)
 */
export interface ApiWatcher {
  close(): void;
}

/**
 * Creates a watcher for the API directory using Node.js fs.watch
 * Returns a function to stop watching
 */
export function watchApiDirectory(
  apiDir: string,
  callback: FileChangeCallback,
  options: WatchApiDirectoryOptions = {}
): ApiWatcher {
  if (!fs.existsSync(apiDir)) {
    return { close: () => {} };
  }

  const debounceMs = options.debounceMs ?? 0;
  let pending: Array<{ event: FileChangeEvent; filePath: string }> = [];
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
    const toEmit = pending;
    pending = [];
    for (const { event, filePath } of toEmit) {
      callback(event, filePath);
    }
  };

  const schedule = (event: FileChangeEvent, filePath: string) => {
    pending.push({ event, filePath });
    if (debounceMs <= 0) {
      flush();
      return;
    }
    if (timer != null) clearTimeout(timer);
    timer = setTimeout(flush, debounceMs);
  };

  const watcher = fs.watch(apiDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    const filePath = path.join(apiDir, filename);

    const isRouteFile = ROUTE_FILE_PATTERN.test(filename);
    const isMiddlewareFile = MIDDLEWARE_FILE_PATTERN.test(filename);

    if (!isRouteFile && !isMiddlewareFile) {
      return;
    }

    let normalizedEvent: FileChangeEvent;
    if (eventType === 'rename') {
      normalizedEvent = fs.existsSync(filePath) ? 'add' : 'unlink';
    } else {
      normalizedEvent = eventType as FileChangeEvent;
    }

    schedule(normalizedEvent, filePath);
  });

  return {
    close: () => {
      if (timer != null) clearTimeout(timer);
      watcher.close();
    },
  };
}

