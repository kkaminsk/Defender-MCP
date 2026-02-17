import { beforeEach, describe, expect, it, vi } from 'vitest';

const registeredTools: Array<{
  name: string;
  handler: (args: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }>; isError: boolean }>;
}> = [];

const handleScanFileMock = vi.fn();
const handleQuickScanMock = vi.fn();
const handleGetStatusMock = vi.fn();

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: class {
    constructor(_meta: unknown) {}
    tool(
      name: string,
      _description: string,
      _schema: unknown,
      handler: (args: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }>; isError: boolean }>
    ) {
      registeredTools.push({ name, handler });
    }
  },
}));

vi.mock('../src/tools/scan-file.js', () => ({
  handleScanFile: handleScanFileMock,
}));

vi.mock('../src/tools/quick-scan.js', () => ({
  handleQuickScan: handleQuickScanMock,
}));

vi.mock('../src/tools/get-status.js', () => ({
  handleGetStatus: handleGetStatusMock,
}));

describe('createServer', () => {
  beforeEach(() => {
    registeredTools.length = 0;
    handleScanFileMock.mockReset();
    handleQuickScanMock.mockReset();
    handleGetStatusMock.mockReset();
  });

  it('registers all expected tools', async () => {
    const { createServer } = await import('../src/server.js');
    createServer();
    expect(registeredTools.map((tool) => tool.name)).toEqual(['scan_file', 'quick_scan', 'get_status']);
  });

  it('returns isError true when scan_file fails', async () => {
    handleScanFileMock.mockResolvedValueOnce({ file_path: 'C:\\x', scanned: false, error: 'bad' });
    const { createServer } = await import('../src/server.js');
    createServer();
    const scanTool = registeredTools.find((tool) => tool.name === 'scan_file');
    expect(scanTool).toBeDefined();
    const result = await scanTool!.handler({ file_path: 'C:\\x' });
    expect(result.isError).toBe(true);
  });
});
