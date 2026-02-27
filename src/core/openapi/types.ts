export type RouteForDocs = {
  pattern: string;
  method: string;
  params: string[];
  file: string;
  bodyType?: string;
  queryType?: string;
};

export interface OpenApiInfo {
  title: string;
  version: string;
  description?: string;
}

export interface OpenApiServer {
  url: string;
  description?: string;
}

export interface OpenApiOptions {
  info?: OpenApiInfo;
  servers?: OpenApiServer[];
  apiBasePath?: string;
}

export interface ResponseMetadata {
  description: string;
  type?: string;
  example?: unknown;
}

export interface RouteMetadata {
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  responses?: Record<string, ResponseMetadata>;
  bodyDescription?: string;
  queryDescription?: string;
  paramDescriptions?: Record<string, string>;
}

export const DEFAULT_OPENAPI_INFO: OpenApiInfo = {
  title: 'Vitek API',
  version: '1.0.0',
  description: 'Auto-generated API documentation',
};

export interface ApiDocsHtmlOptions {
  asyncApiJsonPath?: string;
}
