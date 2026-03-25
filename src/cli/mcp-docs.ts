import { startMcpDocsServer } from '../mcp-docs-server/start-mcp-docs-server.js';

export async function runMcpDocs(): Promise<void> {
  await startMcpDocsServer();
}
