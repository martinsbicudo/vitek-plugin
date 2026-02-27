/**
 * Shared context for Vitek sub-plugins.
 * Populated in configResolved, used by resolve, transform, build, dev, preview.
 */

import type { VitekOptions } from './options.js';

export interface PluginContext {
  options: VitekOptions;
  apiDirOption: string;
  buildApi: boolean;
  root?: string;
  buildOutDir?: string;
  cleanupFn: (() => void) | null;
}

export function createPluginContext(options: VitekOptions, apiDirOption: string, buildApi: boolean): PluginContext {
  return {
    options,
    apiDirOption,
    buildApi,
    cleanupFn: null,
  };
}
