import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DefenderService } from './services/defender.js';
import { Config } from './types/index.js';
import { registerScanTools } from './tools/scan.js';
import { registerStatusTools } from './tools/status.js';
import { registerThreatTools } from './tools/threats.js';
import { registerSignatureTools } from './tools/signatures.js';
import { registerScanStatusTools } from './tools/scan-status.js';

export function createServer(config: Config): McpServer {
  const server = new McpServer({
    name: 'defender-mcp',
    version: '0.1.0',
  });

  const defender = new DefenderService(config);

  registerScanTools(server, defender, config);
  registerStatusTools(server, defender);
  registerThreatTools(server, defender);
  registerSignatureTools(server, defender);
  registerScanStatusTools(server, defender);

  return server;
}
