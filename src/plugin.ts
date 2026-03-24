/**
 * Main Vite plugin
 * Exports VitekOptions and vitek() — aggregates sub-plugins
 */

export type { VitekOptions, CorsOptions } from './plugin/options.js';
export { vitek } from './plugin/vitek.js';

