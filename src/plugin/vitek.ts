/**
 * Main Vitek plugin — aggregates sub-plugins
 */

import type { Plugin } from 'vite';
import { API_DIR_NAME } from '../shared/constants.js';
import { createPluginContext } from './context.js';
import { createConfigPlugin } from './vitek-config.js';
import { createBuildPlugin } from './vitek-build.js';
import { createResolvePlugin } from './vitek-resolve.js';
import { createTransformPlugin } from './vitek-transform.js';
import { createDevPlugin } from './vitek-dev.js';
import { createPreviewPlugin } from './vitek-preview.js';
import type { VitekOptions } from './options.js';

/**
 * Vite plugin for Vitek — returns array of sub-plugins.
 */
export function vitek(options: VitekOptions = {}): Plugin[] {
  const apiDirOption = options.apiDir || `src/${API_DIR_NAME}`;
  const buildApi = options.buildApi !== false;
  const ctx = createPluginContext(options, apiDirOption, buildApi);

  return [
    createConfigPlugin(ctx),
    createBuildPlugin(ctx),
    createResolvePlugin(ctx),
    createTransformPlugin(ctx),
    createDevPlugin(ctx),
    createPreviewPlugin(ctx),
  ];
}
