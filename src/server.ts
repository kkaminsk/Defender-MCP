import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { handleScanFile } from './tools/scan-file.js';
import { handleQuickScan } from './tools/quick-scan.js';
import { handleGetStatus } from './tools/get-status.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'defender-mcp',
    version: '0.1.0',
  });

  server.tool(
    'scan_file',
    'Scan a single file using Windows Defender',
    { file_path: z.string().describe('Absolute path to the file to scan') },
    async (args) => {
      const result = await handleScanFile(args);
      const isError = !result.scanned;
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }], isError };
    }
  );

  server.tool(
    'quick_scan',
    'Run a Windows Defender quick scan',
    {},
    async () => {
      const result = await handleQuickScan();
      const isError = !result.completed;
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }], isError };
    }
  );

  server.tool(
    'get_status',
    'Get Windows Defender antivirus status',
    {},
    async () => {
      const result = await handleGetStatus();
      const isError = !!result.error;
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }], isError };
    }
  );

  return server;
}
