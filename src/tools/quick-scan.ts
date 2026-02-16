import { runPowerShell } from '../powershell.js';
import { QuickScanResult } from '../types.js';

const TIMEOUT = parseInt(process.env.DEFENDER_QUICK_SCAN_TIMEOUT_MS || '600000', 10);

export async function handleQuickScan(): Promise<QuickScanResult> {
  const script = `
Start-MpScan -ScanType QuickScan
@{ completed = $true; message = "Quick scan completed successfully" } | ConvertTo-Json -Compress
`;

  try {
    const output = await runPowerShell(script, TIMEOUT);
    const parsed = JSON.parse(output.trim());
    return { scan_type: 'QuickScan', completed: parsed.completed, message: parsed.message };
  } catch (err: any) {
    return { scan_type: 'QuickScan', completed: false, message: err.message, error: err.message };
  }
}
