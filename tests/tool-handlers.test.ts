import { beforeEach, describe, expect, it, vi } from 'vitest';

const runPowerShellMock = vi.fn();

vi.mock('../src/powershell.js', () => ({
  runPowerShell: runPowerShellMock,
}));

describe('tool handlers', () => {
  beforeEach(() => {
    runPowerShellMock.mockReset();
    process.env.DEFENDER_ALLOWED_PATHS = '*';
  });

  it('handleScanFile returns required argument error', async () => {
    const { handleScanFile } = await import('../src/tools/scan-file.js');
    const result = await handleScanFile({});
    expect(result.scanned).toBe(false);
    expect(result.error).toBe('file_path is required');
  });

  it('handleScanFile maps successful scan response', async () => {
    runPowerShellMock.mockResolvedValueOnce(
      '{"scanned":true,"threats_found":1,"threats":[{"name":"EICAR","severityID":3,"statusID":1,"detected_at":"2026-02-17T00:00:00.000Z"}]}'
    );
    const { handleScanFile } = await import('../src/tools/scan-file.js');
    const result = await handleScanFile({ file_path: 'C:\\Temp\\GitHub\\Defender-MCP\\sample.txt' });
    expect(result.scanned).toBe(true);
    expect(result.threats_found).toBe(1);
    expect(result.threats?.[0]).toEqual({
      name: 'EICAR',
      severity: 'High',
      status: 'Detected',
      detected_at: '2026-02-17T00:00:00.000Z',
    });
  });

  it('handleQuickScan returns error when powershell fails', async () => {
    runPowerShellMock.mockRejectedValueOnce(new Error('scan failed'));
    const { handleQuickScan } = await import('../src/tools/quick-scan.js');
    const result = await handleQuickScan();
    expect(result.completed).toBe(false);
    expect(result.error).toBe('scan failed');
  });

  it('handleGetStatus maps defender state', async () => {
    runPowerShellMock.mockResolvedValueOnce(
      '{"antivirus_enabled":true,"realtime_protection":true,"antispyware_enabled":true,"service_running":true,"signature_version":"1.2.3.4","signature_last_updated":"2026-02-17T00:00:00.000Z","last_quick_scan":"","last_full_scan":"","computer_state":0}'
    );
    const { handleGetStatus } = await import('../src/tools/get-status.js');
    const result = await handleGetStatus();
    expect(result.antivirus_enabled).toBe(true);
    expect(result.computer_state).toBe('Clean');
  });
});
