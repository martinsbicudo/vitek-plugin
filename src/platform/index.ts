export {
  DEFAULT_PLATFORM_CONFIG,
  mergePlatformConfig,
  loadPlatformConfig,
  isFeatureEnabled,
} from './config.js';
export type {
  FeatureFlags,
  RedactionPolicy,
  AiProvider,
  AiMode,
  AiAnalyzerConfig,
  PlatformConfig,
} from './config.js';
export {
  REDACTED_VALUE,
  redactHeaders,
  redactObject,
} from './redaction.js';
export {
  sanitizeIncomingRequestId,
  readRequestIdFromHeaders,
  getOrCreateRequestId,
} from './correlation.js';
