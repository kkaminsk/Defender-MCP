import { runPowerShell } from '../powershell.js';
import { DefenderStatus } from '../types.js';
import { getStatusTimeoutMs } from '../config.js';

interface DefenderStatusPayload {
  antivirus_enabled: boolean;
  realtime_protection: boolean;
  antispyware_enabled: boolean;
  service_running: boolean;
  signature_version: string;
  signature_last_updated: string;
  last_quick_scan: string;
  last_full_scan: string;
  computer_state: number;
}

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
$ErrorActionPreference = 'Stop'
$s = Get-MpComputerStatus
@{
    antivirus_enabled = [bool]$s.AntivirusEnabled
    realtime_protection = [bool]$s.RealTimeProtectionEnabled
    antispyware_enabled = [bool]$s.AntispywareEnabled
    service_running = [bool]$s.AMServiceEnabled
    signature_version = $s.AntivirusSignatureVersion
    signature_last_updated = if ($s.AntivirusSignatureLastUpdated) { $s.AntivirusSignatureLastUpdated.ToUniversalTime().ToString('o') } else { '' }
    last_quick_scan = if ($s.QuickScanEndTime) { $s.QuickScanEndTime.ToUniversalTime().ToString('o') } else { '' }
    last_full_scan = if ($s.FullScanEndTime) { $s.FullScanEndTime.ToUniversalTime().ToString('o') } else { '' }
    computer_state = $s.ComputerState
} | ConvertTo-Json -Compress
`;

  try {
    const output = await runPowerShell(script, getStatusTimeoutMs());
    const parsed = JSON.parse(output.trim()) as DefenderStatusPayload;
    return {
      ...parsed,
      computer_state: STATE_MAP[parsed.computer_state] || `Unknown (${parsed.computer_state})`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to query Defender status';
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
      error: message,
    };
  }
}
