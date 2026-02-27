import * as path from 'path';
import * as fs from 'fs';
import type { ParsedRoute } from '../routing/route-parser.js';
import type { ParsedSocket } from '../routing/socket-parser.js';
import type { RouteSchema } from '../types/schema.js';
import { extractBodyTypeFromFile, extractQueryTypeFromFile } from '../file-system/extract-type-from-file.js';
import { generateTypesFile, generateServicesFile } from '../types/generate.js';
import { generateSocketTypesFile } from '../types/generate-socket-types.js';
import { generateSocketServicesFile } from '../types/generate-socket-services.js';
import { generateOpenApiFile, generateApiDocsHtml, type OpenApiOptions } from '../openapi/generate.js';
import { generateAsyncApiFile } from '../asyncapi/generate.js';
import { socketsToSchema } from '../types/socket-schema.js';
import {
  API_BASE_PATH,
  GENERATED_TYPES_FILE,
  GENERATED_SERVICES_FILE,
  GENERATED_SOCKET_TYPES_FILE,
  GENERATED_SOCKET_SERVICES_FILE,
} from '../../shared/constants.js';

function isTypeScriptProject(root: string): boolean {
  const tsconfigPath = path.join(root, 'tsconfig.json');
  return fs.existsSync(tsconfigPath);
}

export function parsedRoutesToSchema(parsedRoutes: ParsedRoute[]): RouteSchema[] {
  return parsedRoutes.map((p) => ({
    pattern: p.pattern,
    method: p.method,
    params: p.params,
    file: p.file,
    bodyType: extractBodyTypeFromFile(p.file),
    queryType: extractQueryTypeFromFile(p.file),
  }));
}

export interface RunFileGenerationOptions {
  root: string;
  schema: RouteSchema[];
  sockets: ParsedSocket[];
  apiBasePath?: string;
  socketBasePath?: string;
  openApi?: OpenApiOptions | boolean;
  serverPort?: number;
  logger?: {
    typesGenerated?: (path: string) => void;
    servicesGenerated?: (path: string) => void;
    info?: (message: string) => void;
    warn?: (message: string) => void;
  };
}

export async function runFileGeneration(options: RunFileGenerationOptions): Promise<void> {
  const {
    root,
    schema,
    sockets,
    apiBasePath = API_BASE_PATH,
    socketBasePath = `${apiBasePath}/ws`,
    openApi,
    serverPort = 5173,
    logger,
  } = options;

  const logTypes = logger?.typesGenerated ?? (() => {});
  const logServices = logger?.servicesGenerated ?? (() => {});
  const logInfo = logger?.info ?? (() => {});
  const logWarn = logger?.warn ?? (() => {});

  const isTypeScript = isTypeScriptProject(root);
  const srcDir = path.join(root, 'src');

  if (schema.length > 0) {
    if (isTypeScript) {
      const typesPath = path.join(srcDir, GENERATED_TYPES_FILE);
      await generateTypesFile(typesPath, schema, apiBasePath);
      logTypes(`./${path.relative(root, typesPath).replace(/\\/g, '/')}`);
    }

    const servicesFileName = isTypeScript ? GENERATED_SERVICES_FILE : 'api.services.js';
    const servicesPath = path.join(srcDir, servicesFileName);
    await generateServicesFile(servicesPath, schema, apiBasePath, isTypeScript);
    logServices(`./${path.relative(root, servicesPath).replace(/\\/g, '/')}`);
  }

  if (sockets.length > 0) {
    const socketSchema = socketsToSchema(sockets);
    if (isTypeScript) {
      const socketTypesPath = path.join(srcDir, GENERATED_SOCKET_TYPES_FILE);
      await generateSocketTypesFile(socketTypesPath, socketSchema, socketBasePath);
      logTypes(`./${path.relative(root, socketTypesPath).replace(/\\/g, '/')}`);
    }

    const socketServicesFileName = isTypeScript ? GENERATED_SOCKET_SERVICES_FILE : 'socket.services.js';
    const socketServicesPath = path.join(srcDir, socketServicesFileName);
    await generateSocketServicesFile(socketServicesPath, socketSchema, socketBasePath, isTypeScript);
    logServices(`./${path.relative(root, socketServicesPath).replace(/\\/g, '/')}`);
  }

  if (openApi) {
    try {
      const openApiOptions: OpenApiOptions =
        typeof openApi === 'boolean'
          ? { apiBasePath }
          : { ...openApi, apiBasePath: openApi.apiBasePath ?? apiBasePath };

      const publicDir = path.join(root, 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const openApiPath = path.join(publicDir, 'openapi.json');
      await generateOpenApiFile(openApiPath, schema, openApiOptions);
      logInfo(`OpenAPI spec generated: ./${path.relative(root, openApiPath).replace(/\\/g, '/')}`);

      if (sockets.length > 0) {
        const asyncApiPath = path.join(publicDir, 'asyncapi.json');
        await generateAsyncApiFile(asyncApiPath, sockets, socketBasePath, {
          serverUrl: `ws://localhost:${serverPort}`,
        });
        logInfo(`AsyncAPI spec generated: ./${path.relative(root, asyncApiPath).replace(/\\/g, '/')}`);
      }

      const apiDocsPath = path.join(publicDir, 'api-docs.html');
      const title = openApiOptions.info?.title ?? 'Vitek API';
      const apiDocsHtml = generateApiDocsHtml('/openapi.json', title, {
        asyncApiJsonPath: sockets.length > 0 ? '/asyncapi.json' : undefined,
      });
      fs.writeFileSync(apiDocsPath, apiDocsHtml, 'utf-8');
      logInfo(
        `API docs at: ./${path.relative(root, apiDocsPath).replace(/\\/g, '/')} → http://localhost:${serverPort}/api-docs.html`
      );
    } catch (error) {
      logWarn(
        `Failed to generate OpenAPI spec: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
