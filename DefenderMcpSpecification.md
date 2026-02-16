# Defender-MCP Application Specification

## Purpose

A lightweight Model Context Protocol (MCP) server that uses **PowerShell only** to scan individual files and report basic Windows Defender antivirus state. No MpCmdRun.exe, no WMI/CIM, no REST APIs, no AMSI — just PowerShell cmdlets over stdio transport.

## Scope

This server does exactly three things:

1. **Scan a single file** — tell the agent whether a specific file is clean or infected
2. **Run a quick scan** — trigger Windows Defender's built-in quick scan
3. **Report antivirus state** — signature freshness, protection status, last scan time

Nothing else. No threat remediation, no quarantine management, no configuration changes, no signature updates.

---

## Tools

### 1. `scan_file`

Scan a single file path using Windows Defender.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `file_path` | string | yes | Absolute path to the file to scan |

**PowerShell Execution:**

```powershell
# Step 1: Validate the file exists
if (-not (Test-Path -LiteralPath $FilePath -PathType Leaf)) {
    throw "File not found: $FilePath"
}

# Step 2: Run a custom scan on the single file
Start-MpScan -ScanType CustomScan -ScanPath $FilePath

# Step 3: Check if any threats were detected for this path
$detections = Get-MpThreatDetection | Where-Object {
    $_.Resources -match [regex]::Escape($FilePath)
} | Sort-Object InitialDetectionTime -Descending | Select-Object -First 5
```

**Response Schema:**

```json
{
  "file_path": "C:\\Users\\kevin\\Downloads\\suspect.exe",
  "scanned": true,
  "threats_found": 1,
  "threats": [
    {
      "name": "Trojan:Win32/Example",
      "severity": "High",
      "status": "Quarantined",
      "detected_at": "2026-02-15T21:30:00Z"
    }
  ]
}
```

If no threats are found:

```json
{
  "file_path": "C:\\Users\\kevin\\Documents\\report.pdf",
  "scanned": true,
  "threats_found": 0,
  "threats": []
}
```

**Behavior:**

- Scan is **synchronous** — the tool blocks until `Start-MpScan` completes
- No `-AsJob`, no polling, no queue. Single file scans are fast (typically <5 seconds)
- After the scan completes, query `Get-MpThreatDetection` filtered to the scanned path
- Map `SeverityID` to human-readable labels (0=Unknown, 1=Low, 2=Moderate, 3=High, 4=Severe)
- Map `ThreatStatusID` to labels (1=Detected, 2=Cleaned, 3=Quarantined, 4=Removed, 5=Allowed, 6=Blocked)

---

### 2. `quick_scan`

Trigger a system-wide quick scan.

**Parameters:** None.

**PowerShell Execution:**

```powershell
Start-MpScan -ScanType QuickScan
```

**Response Schema:**

```json
{
  "scan_type": "QuickScan",
  "completed": true,
  "message": "Quick scan completed successfully"
}
```

**Behavior:**

- Synchronous — blocks until the quick scan finishes (typically 1–5 minutes)
- No parameters, no path filtering — this scans common threat locations as defined by Defender
- If the scan fails or times out, return `"completed": false` with an error message
- **Timeout:** 10 minutes. If `Start-MpScan` hasn't returned, kill the PowerShell process and report timeout

---

### 3. `get_status`

Return current Windows Defender antivirus state.

**Parameters:** None.

**PowerShell Execution:**

```powershell
Get-MpComputerStatus | Select-Object `
    AMServiceEnabled, `
    AntispywareEnabled, `
    AntivirusEnabled, `
    RealTimeProtectionEnabled, `
    AntivirusSignatureLastUpdated, `
    AntivirusSignatureVersion, `
    FullScanEndTime, `
    QuickScanEndTime, `
    ComputerState
```

**Response Schema:**

```json
{
  "antivirus_enabled": true,
  "realtime_protection": true,
  "antispyware_enabled": true,
  "service_running": true,
  "signature_version": "1.403.2816.0",
  "signature_last_updated": "2026-02-15T18:00:00Z",
  "last_quick_scan": "2026-02-15T12:30:00Z",
  "last_full_scan": "2026-02-10T03:00:00Z",
  "computer_state": "Clean"
}
```

**ComputerState Mapping:**

| Value | Label |
|-------|-------|
| 0 | Clean |
| 1 | Pending Full Scan |
| 2 | Pending Reboot |
| 4 | Pending Manual Steps |
| 6 | Pending Offline Scan |
| 8 | Pending Critical Failure Recovery |

---

## Architecture

### Transport

**stdio only.** The MCP server reads JSON-RPC from stdin and writes to stdout. No HTTP, no WebSocket.

### Runtime

- **Node.js** with TypeScript
- **`@modelcontextprotocol/sdk`** for MCP protocol handling
- **`child_process.execFile`** to invoke `powershell.exe` (or `pwsh.exe` if available)

### PowerShell Execution Model

All Defender interaction goes through a single function:

```typescript
async function runPowerShell(script: string, timeoutMs: number): Promise<string> {
  // 1. Write script to a temp .ps1 file (avoids argument escaping issues)
  // 2. Execute: powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File <temp.ps1>
  // 3. Capture stdout as the result
  // 4. Parse as JSON (all scripts output ConvertTo-Json)
  // 5. Clean up temp file
  // 6. Kill process if timeout exceeded
}
```

**Why temp files:** PowerShell argument escaping from Node.js `child_process` is unreliable on Windows. Writing a `.ps1` file and executing with `-File` is deterministic.

**Why `-NoProfile`:** Avoids loading user profile scripts that could interfere with output.

### Project Structure

```
Defender-MCP/
├── src/
│   ├── index.ts              # Entry point — stdio transport setup
│   ├── server.ts             # MCP server — register 3 tools
│   ├── powershell.ts         # runPowerShell() — temp file, exec, parse
│   ├── tools/
│   │   ├── scan-file.ts      # scan_file handler
│   │   ├── quick-scan.ts     # quick_scan handler
│   │   └── get-status.ts     # get_status handler
│   ├── validation.ts         # Path validation
│   └── types.ts              # TypeScript interfaces
├── tests/
│   ├── validation.test.ts
│   └── powershell.test.ts
├── package.json
├── tsconfig.json
├── README.md
├── CLAUDE.md
└── LICENSE
```

---

## Security

### Path Validation (`scan_file` only)

Before passing any path to PowerShell:

1. **Must be absolute** — reject relative paths
2. **Must exist** — `Test-Path` check before scanning
3. **Must be a file** — reject directories (this tool scans single files)
4. **No path traversal** — reject paths containing `..`
5. **No UNC paths** — reject paths starting with `\\`
6. **No null bytes** — reject paths containing `\0`

```typescript
function validateFilePath(filePath: string): { valid: boolean; error?: string } {
  if (!path.isAbsolute(filePath)) return { valid: false, error: 'Path must be absolute' };
  if (filePath.includes('..'))     return { valid: false, error: 'Path traversal not allowed' };
  if (filePath.startsWith('\\\\'))  return { valid: false, error: 'UNC paths not allowed' };
  if (filePath.includes('\0'))     return { valid: false, error: 'Null bytes not allowed' };
  return { valid: true };
}
```

### No Elevation Required

All three tools work **without administrator privileges**:

- `Start-MpScan -ScanType CustomScan` — standard user ✅
- `Start-MpScan -ScanType QuickScan` — standard user ✅
- `Get-MpComputerStatus` — standard user ✅
- `Get-MpThreatDetection` — standard user ✅

The server **does not** require or request elevation. If a cmdlet fails due to permissions, return a clear error — never prompt for UAC.

### No Configuration Changes

The server is **read-only plus scan**. It never calls:

- `Set-MpPreference` (modify settings)
- `Add-MpPreference` / `Remove-MpPreference` (exclusions)
- `Remove-MpThreat` (remediation)
- `Update-MpSignature` (signature updates)

### Input Sanitization

All user-provided strings are passed to PowerShell via **variable injection in the temp .ps1 file**, never via string interpolation into commands:

```powershell
# GOOD — variable at top of script, never interpolated into command strings
$FilePath = 'C:\Users\kevin\Downloads\suspect.exe'
Start-MpScan -ScanType CustomScan -ScanPath $FilePath

# BAD — never do this
Start-MpScan -ScanType CustomScan -ScanPath "C:\Users\kevin\Downloads\suspect.exe"
```

The file path value is escaped using PowerShell single-quote escaping (double any embedded single quotes).

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| File not found | Return `{ scanned: false, error: "File not found: <path>" }` |
| Path validation fails | Return `{ scanned: false, error: "<validation message>" }` |
| Defender service not running | Return `{ error: "Windows Defender service (WinDefend) is not running" }` |
| PowerShell not available | Return `{ error: "PowerShell is not available on this system" }` |
| Scan timeout (>10 min quick, >60s file) | Kill process, return `{ error: "Scan timed out" }` |
| Permission denied | Return `{ error: "Insufficient permissions: <details>" }` |
| Non-Windows OS | Return `{ error: "Defender-MCP requires Windows" }` |

All errors are returned as MCP tool results with `isError: true`. The server never crashes on tool errors.

---

## Configuration

Minimal. Environment variables only:

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFENDER_FILE_SCAN_TIMEOUT_MS` | `60000` | Timeout for single file scan (1 min) |
| `DEFENDER_QUICK_SCAN_TIMEOUT_MS` | `600000` | Timeout for quick scan (10 min) |
| `DEFENDER_POWERSHELL_PATH` | `powershell.exe` | Override PowerShell executable (e.g. `pwsh.exe`) |

No config files. No allowed-path restrictions (path validation handles safety). No feature flags.

---

## Dependencies

**Runtime:**
- `@modelcontextprotocol/sdk` — MCP protocol
- Node.js built-in `child_process`, `fs`, `path`, `os`

**Dev:**
- `typescript`
- `vitest` (testing)

**Total external dependencies:** 1 (the MCP SDK).

---

## What This Is Not

To keep scope tight, this server explicitly **does not**:

- Manage quarantine or remediate threats
- Update virus definitions
- Modify Defender settings or exclusions
- Support full system scans
- Support directory scanning (single files only)
- Provide async/polling scan workflows
- Integrate with Microsoft Defender for Endpoint (cloud API)
- Use MpCmdRun.exe, WMI/CIM, or AMSI
- Run on Linux or macOS
