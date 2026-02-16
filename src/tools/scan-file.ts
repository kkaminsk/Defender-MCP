import { validateFilePath } from '../validation.js';
import { runPowerShell } from '../powershell.js';
import { ScanFileResult } from '../types.js';

const TIMEOUT = parseInt(process.env.DEFENDER_FILE_SCAN_TIMEOUT_MS || '60000', 10);

const SEVERITY_MAP: Record<number, string> = {
  0: 'Unknown', 1: 'Low', 2: 'Moderate', 3: 'High', 4: 'Severe',
};

const STATUS_MAP: Record<number, string> = {
  1: 'Detected', 2: 'Cleaned', 3: 'Quarantined', 4: 'Removed', 5: 'Allowed', 6: 'Blocked',
};

export async function handleScanFile(args: Record<string, unknown>): Promise<ScanFileResult> {
  const filePath = args.file_path as string;
  if (!filePath) {
    return { file_path: '', scanned: false, error: 'file_path is required' };
  }

  const validation = validateFilePath(filePath);
  if (!validation.valid) {
    return { file_path: filePath, scanned: false, error: validation.error };
  }

  // Escape single quotes for PS single-quoted string
  const escaped = filePath.replace(/'/g, "''");

  const script = `
$FilePath = '${escaped}'
if (-not (Test-Path -LiteralPath $FilePath -PathType Leaf)) {
    @{ scanned = $false; error = "File not found: $FilePath" } | ConvertTo-Json -Compress
    exit 0
}
Start-MpScan -ScanType CustomScan -ScanPath $FilePath
$detections = Get-MpThreatDetection | Where-Object {
    $_.Resources -match [regex]::Escape($FilePath)
} | Sort-Object InitialDetectionTime -Descending | Select-Object -First 5
$threats = @()
foreach ($d in $detections) {
    $threats += @{
        name = (Get-MpThreat | Where-Object { $_.ThreatID -eq $d.ThreatID } | Select-Object -ExpandProperty ThreatName -ErrorAction SilentlyContinue) -as [string]
        severityID = $d.SeverityID
        statusID = $d.ThreatStatusID
        detected_at = $d.InitialDetectionTime.ToUniversalTime().ToString('o')
    }
}
@{
    scanned = $true
    threats_found = $threats.Count
    threats = $threats
} | ConvertTo-Json -Compress -Depth 5
`;

  try {
    const output = await runPowerShell(script, TIMEOUT);
    const parsed = JSON.parse(output.trim());
    if (parsed.error) {
      return { file_path: filePath, scanned: false, error: parsed.error };
    }
    const threats = (parsed.threats || []).map((t: any) => ({
      name: t.name || 'Unknown',
      severity: SEVERITY_MAP[t.severityID] || 'Unknown',
      status: STATUS_MAP[t.statusID] || 'Unknown',
      detected_at: t.detected_at || '',
    }));
    return {
      file_path: filePath,
      scanned: true,
      threats_found: parsed.threats_found || 0,
      threats,
    };
  } catch (err: any) {
    return { file_path: filePath, scanned: false, error: err.message };
  }
}
