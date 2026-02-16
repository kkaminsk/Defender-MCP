import { runPowerShell } from '../powershell.js';
import { DefenderStatus } from '../types.js';

const STATE_MAP: Record<number, string> = {
  0: 'Clean',
  1: 'Pending Full Scan',
  2: 'Pending Reboot',
  4: 'Pending Manual Steps',
  6: 'Pending Offline Scan',
  8: 'Pending Critical Failure Recovery',
};

export async function handleGetStatus(): Promise<DefenderStatus> {
  const script = `
$s = Get-MpComputerStatus
@{
    antivirus_enabled = [bool]$s.AntivirusEnabled
    realtime_protection = [bool]$s.RealTimeProtectionEnabled
    antispyware_enabled = [bool]$s.AntispywareEnabled
    service_running = [bool]$s.AMServiceEnabled
    signature_version = $s.AntivirusSignatureVersion
    signature_last_updated = $s.AntivirusSignatureLastUpdated.ToUniversalTime().ToString('o')
    last_quick_scan = $s.QuickScanEndTime.ToUniversalTime().ToString('o')
    last_full_scan = $s.FullScanEndTime.ToUniversalTime().ToString('o')
    computer_state = $s.ComputerState
} | ConvertTo-Json -Compress
`;

  try {
    const output = await runPowerShell(script, 30000);
    const parsed = JSON.parse(output.trim());
    return {
      ...parsed,
      computer_state: STATE_MAP[parsed.computer_state] || `Unknown (${parsed.computer_state})`,
    };
  } catch (err: any) {
    return {
      antivirus_enabled: false,
      realtime_protection: false,
      antispyware_enabled: false,
      service_running: false,
      signature_version: '',
      signature_last_updated: '',
      last_quick_scan: '',
      last_full_scan: '',
      computer_state: 'Unknown',
      error: err.message,
    };
  }
}
