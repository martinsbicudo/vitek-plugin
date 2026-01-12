/**
 * API directory watcher
 * Core logic - abstracted to be runtime agnostic
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROUTE_FILE_PATTERN, MIDDLEWARE_FILE_PATTERN } from '../../shared/constants.js';

export type FileChangeEvent = 'add' | 'change' | 'unlink';
export type FileChangeCallback = (event: FileChangeEvent, filePath: string) => void;

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
  callback: FileChangeCallback
): ApiWatcher {
  if (!fs.existsSync(apiDir)) {
    return { close: () => {} };
  }
  
  const watcher = fs.watch(apiDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    
    const filePath = path.join(apiDir, filename);
    
    // Ignore if it's not a route file or relevant middleware
    const isRouteFile = ROUTE_FILE_PATTERN.test(filename);
    const isMiddlewareFile = MIDDLEWARE_FILE_PATTERN.test(filename);
    
    if (!isRouteFile && !isMiddlewareFile) {
      return;
    }
    
    // Normalize event type
    let normalizedEvent: FileChangeEvent;
    if (eventType === 'rename') {
      // rename can be add or unlink, check if it exists
      normalizedEvent = fs.existsSync(filePath) ? 'add' : 'unlink';
    } else {
      normalizedEvent = eventType as FileChangeEvent;
    }
    
    callback(normalizedEvent, filePath);
  });
  
  return {
    close: () => watcher.close(),
  };
}

