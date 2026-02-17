import { runPowerShell } from '../powershell.js';
import { QuickScanResult } from '../types.js';
import { getQuickScanTimeoutMs } from '../config.js';

interface QuickScanPayload {
  completed?: boolean;
  message?: string;
}

export async function handleQuickScan(): Promise<QuickScanResult> {
  const script = `
$ErrorActionPreference = 'Stop'
Start-MpScan -ScanType QuickScan
@{ completed = $true; message = "Quick scan completed successfully" } | ConvertTo-Json -Compress
`;

  try {
    const output = await runPowerShell(script, getQuickScanTimeoutMs());
    const parsed = JSON.parse(output.trim()) as QuickScanPayload;
    return {
      scan_type: 'QuickScan',
      completed: parsed.completed ?? false,
      message: parsed.message || 'Quick scan completed successfully',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Quick scan failed';
    return { scan_type: 'QuickScan', completed: false, message, error: message };
  }
}
