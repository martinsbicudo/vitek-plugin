/**
 * Export público do pacote Vitek
 */

export { vitek } from './plugin.js';
export type { VitekOptions } from './plugin.js';

// Re-export types úteis do core (opcional, para uso avançado)
export type {
  VitekContext,
  VitekRequest,
} from './core/context/create-context.js';

export type {
  Route,
  RouteHandler,
  Middleware,
  RouteMatch,
} from './core/routing/route-types.js';

