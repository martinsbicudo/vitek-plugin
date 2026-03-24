export type { DriftSeverity, DriftIssue } from './types.js';
export { sortKeysDeep } from './sort-json.js';
export { compareOpenApiSpecs } from './compare-openapi.js';
export { compareAsyncApiSpecs } from './compare-asyncapi.js';
export { loadProjectContractSpecs } from './project-specs.js';

export const CONTRACT_DIR = '.vitek/contract';
export const OPENAPI_SNAPSHOT_FILE = 'openapi.snapshot.json';
export const ASYNCAPI_SNAPSHOT_FILE = 'asyncapi.snapshot.json';
