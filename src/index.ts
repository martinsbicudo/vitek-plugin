/**
 * Public exports for the Vitek package
 */

export { vitek } from './plugin.js';
export type { VitekOptions } from './plugin.js';

export type {
  VitekContext,
  VitekRequest,
  VitekResponse,
} from './core/context/create-context.js';

export type {
  Route,
  RouteHandler,
  Middleware,
  RouteMatch,
} from './core/routing/route-types.js';
export type { ParsedRoute } from './core/routing/route-parser.js';
export type { ParsedSocket } from './core/routing/socket-parser.js';

export type { VitekSocketContext } from './core/socket/socket-handler.js';

export type { SocketEmitter, ApiClient, VitekApp } from './core/shared/vitek-app.js';

export {
  json,
  ok,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessableEntity,
  tooManyRequests,
  internalServerError,
  redirect,
  cacheControl,
  noStore,
} from './shared/response-helpers.js';

export {
  VitekError,
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  InternalServerError,
} from './shared/errors.js';

export {
  validate,
  validateOrThrow,
  validateBody,
  validateQuery,
} from './core/validation/validator.js';
export type { ValidationSchema, ValidationRule, ValidationResult } from './core/validation/types.js';

export {
  getManifest,
  getRoutes,
  getSockets,
  writeManifest,
} from './core/introspection/manifest.js';
export type { VitekManifest } from './core/introspection/manifest.js';

export type { OpenApiOptions, OpenApiInfo, OpenApiServer } from './core/openapi/generate.js';
export type { AsyncApiOptions, AsyncApiInfo } from './core/asyncapi/generate.js';

export type { VitekPlugin, AfterTypesGeneratedContext, BeforeApiRequestContext } from './plugin/plugin-api.js';

