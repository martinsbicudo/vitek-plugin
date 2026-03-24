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
  text,
  html,
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

export { isProduction } from './shared/utils.js';

export {
  createMockContext,
  createMockReq,
  createMockRes,
  runMiddlewareChain,
} from './testing/testing.js';
export type { MockServerResponse } from './testing/testing.js';

export { createEventBus } from './core/events/index.js';
export type { EventMap, EventHandler, EventBus } from './core/events/index.js';

export { defineSchedule, runScheduleOnce, InMemoryLockProvider } from './core/scheduler/index.js';
export type {
  ScheduleTask,
  ScheduleDefinition,
  TaskRunResult,
  ScheduleRunResult,
  SchedulerLockProvider,
} from './core/scheduler/index.js';

export { generateCrudFiles } from './core/generators/index.js';
export type {
  DataAdapterName,
  GeneratedFile,
  CrudGeneratorInput,
  DataAdapterGenerator,
} from './core/generators/index.js';

