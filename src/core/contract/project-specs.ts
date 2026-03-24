import * as path from 'path';
import { scanApiDirectory } from '../file-system/scan-api-dir.js';
import { parsedRoutesToSchema } from '../generation/run-file-generation.js';
import type { RouteForDocs } from '../openapi/types.js';
import { generateOpenApiSpec } from '../openapi/generate.js';
import { generateAsyncApiSpec } from '../asyncapi/generate.js';

const STABLE_ASYNCAPI_SERVER = 'ws://127.0.0.1';

export interface ProjectContractSpecsOptions {
  root: string;
  apiDir: string;
  apiBasePath: string;
  socketBasePath: string;
}

export interface ProjectContractSpecs {
  openApi: object;
  asyncApi: object | null;
}

function schemaToRouteForDocs(
  schema: ReturnType<typeof parsedRoutesToSchema>
): RouteForDocs[] {
  return schema.map((s) => ({
    pattern: s.pattern,
    method: s.method,
    params: s.params,
    file: s.file,
    bodyType: s.bodyType,
    queryType: s.queryType,
  }));
}

export function loadProjectContractSpecs(opts: ProjectContractSpecsOptions): ProjectContractSpecs {
  const apiDirAbs = path.resolve(opts.root, opts.apiDir);
  const scan = scanApiDirectory(apiDirAbs);
  const schema = parsedRoutesToSchema(scan.routes);
  const routesForDocs = schemaToRouteForDocs(schema);
  const openApi = generateOpenApiSpec(routesForDocs, { apiBasePath: opts.apiBasePath });
  const asyncApi =
    scan.sockets.length > 0
      ? generateAsyncApiSpec(
          scan.sockets.map((s) => ({ pattern: s.pattern })),
          opts.socketBasePath,
          { serverUrl: STABLE_ASYNCAPI_SERVER }
        )
      : null;
  return { openApi, asyncApi };
}
