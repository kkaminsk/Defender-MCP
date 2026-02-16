# Defender-MCP Architecture

## Overview

Defender-MCP is a Model Context Protocol (MCP) server that enables AI agents to invoke Windows Defender for file scanning, status queries, threat detection, and signature management. It communicates via stdio transport and exposes a set of tools that abstract over multiple Windows Defender interfaces.

## Windows Defender Interfaces

### 1. PowerShell Cmdlets (PRIMARY)

The preferred interface due to rich output, async support, and full feature coverage.

| Cmdlet | Purpose |
|--------|---------|
| `Start-MpScan` | Initiate scans (`-ScanType CustomScan -ScanPath <path>`, `-AsJob` for async) |
| `Get-MpComputerStatus` | Protection status, signature versions, feature states |
| `Get-MpThreat` | List active threats with severity, category, remediation |
| `Get-MpThreatDetection` | Detailed detection history |
| `Update-MpSignature` | Trigger signature definition update |
| `Remove-MpThreat` | Remove/remediate detected threats |

**Async Pattern**: `Start-MpScan -AsJob` returns a PowerShell job object. Poll with `Get-Job -Id <id>` for completion status.

### 2. MpCmdRun.exe (FALLBACK)

Command-line utility used when PowerShell cmdlets are unavailable or for simple operations.

```
MpCmdRun.exe -Scan -ScanType 3 -File <path>    # Custom file scan
MpCmdRun.exe -SignatureUpdate                    # Update signatures
MpCmdRun.exe -Restore                            # Restore quarantined items
```

**Exit Codes**: 0 = success, 2 = failure. Note: only one MpCmdRun scan can run at a time (concurrent scan limitation).

### 3. WMI/CIM Classes

Namespace: `root\microsoft\windows\defender`

| Class | Purpose |
|-------|---------|
| `MSFT_MpComputerStatus` | Computer protection status |
| `MSFT_MpThreat` | Threat information |
| `MSFT_MpThreatDetection` | Detection records |
| `MSFT_MpPreference` | Defender configuration (read-only) |

Used as an alternative query mechanism when PowerShell cmdlets produce unexpected output.

### 4. MDE REST API (OPTIONAL / ENTERPRISE)

For organizations with Microsoft Defender for Endpoint:

- `POST /api/machines/{id}/runAntiVirusScan` — Remote scan trigger
- Advanced Hunting queries via API
- OAuth 2.0 authentication required
- Rate limits: 100 requests/min, 1,500 requests/hr

Not implemented in v1. Placeholder for future enterprise integration.

### 5. AMSI (FUTURE)

Antimalware Scan Interface provides deeper in-memory scanning. Requires native C/C++ interop (N-API addon). Planned for future versions.

## MCP Tools

| Tool | Description | Interface |
|------|-------------|-----------|
| `scan_file` | Scan a specific file or directory path | PowerShell `Start-MpScan -ScanType CustomScan -ScanPath` with `-AsJob` |
| `quick_scan` | Run a quick system-wide scan | PowerShell `Start-MpScan -ScanType QuickScan -AsJob` |
| `get_defender_status` | Get protection status, signature versions, feature states | PowerShell `Get-MpComputerStatus` |
| `get_threats` | List detected threats with severity, category, remediation status | PowerShell `Get-MpThreat` |
| `get_threat_detections` | Detailed detection history with timestamps and sources | PowerShell `Get-MpThreatDetection` |
| `update_signatures` | Trigger signature definition update | PowerShell `Update-MpSignature` |
| `get_scan_status` | Poll status of an async scan job | PowerShell `Get-Job -Id <id>` |

## Threat Data Model

### SeverityID
| Value | Label |
|-------|-------|
| 0 | Unknown |
| 1 | Low |
| 2 | Moderate |
| 3 | High |
| 4 | Severe |

### ThreatStatusID
| Value | Label |
|-------|-------|
| 0 | Unknown |
| 1 | Detected |
| 2 | Cleaned |
| 3 | Quarantined |
| 4 | Removed |
| 5 | Allowed |
| 6 | Blocked |

### CategoryID (48+ categories)
Examples: ADWARE, SPYWARE, TROJAN, WORM, BACKDOOR, RANSOMWARE, PASSWORDSTEALER, VIRUS, EXPLOIT, HACK_TOOL, etc.

### TypeID
| Value | Label |
|-------|-------|
| 0 | Known Bad |
| 1 | Behavior |
| 2 | Unknown |
| 3 | Known Good |
| 4 | NRI |

### CleaningActionID
| Value | Label |
|-------|-------|
| 1 | Clean |
| 2 | Quarantine |
| 3 | Remove |
| 6 | Allow |
| 10 | Block |

### DetectionSourceTypeID
| Value | Label |
|-------|-------|
| 0 | Unknown |
| 1 | User |
| 2 | System |
| 3 | Realtime |
| 4 | IOAV |
| 5 | NRI |
| 7 | ELAM |

## Security Requirements

1. **Admin Privileges**: Scanning operations require elevated (Administrator) privileges. The server should detect and warn if not running elevated.
2. **Path Validation**: All file paths are validated against authorized directories. Path traversal attacks (`../`) are blocked. UNC paths are rejected by default.
3. **No File Access**: The server never reads or executes scanned files directly — it only passes paths to Defender APIs.
4. **Tamper Protection**: Respect Windows Defender Tamper Protection. Never attempt to modify security settings.
5. **Read-Only Configuration**: Configuration queries only. No exclusion modification, no disabling features.
6. **Rate Limiting**: MpCmdRun.exe calls are serialized (one at a time). Concurrent PowerShell scans bounded to 2–4.

## Async Scan Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  MCP Client │────▶│  Scan Queue  │────▶│  PowerShell     │
│  (Agent)    │◀────│  (bounded)   │◀────│  -AsJob         │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                    ┌──────┴──────┐
                    │  Job Cache  │
                    │  (TTL-based)│
                    └─────────────┘
```

1. `scan_file` / `quick_scan` enqueue a scan request
2. Queue dispatches to PowerShell with `-AsJob`, returns a job ID immediately
3. `get_scan_status` polls the job by ID
4. Completed results are cached with a configurable TTL
5. Queue enforces max concurrent scans (default: 4)

## Project Structure

```
src/
├── index.ts          — Entry point, stdio transport
├── server.ts         — MCP server setup, tool registration
├── config.ts         — Configuration, env vars
├── types/
│   └── index.ts      — All interfaces (ScanRequest, ScanResult, Threat, ComputerStatus, etc.)
├── tools/
│   ├── scan.ts       — scan_file, quick_scan tools
│   ├── status.ts     — get_defender_status tool
│   ├── threats.ts    — get_threats, get_threat_detections tools
│   ├── signatures.ts — update_signatures tool
│   └── scan-status.ts— get_scan_status tool
├── services/
│   ├── powershell.ts — PowerShell execution wrapper
│   ├── defender.ts   — Windows Defender interface abstraction
│   └── queue.ts      — Scan queue and rate limiter
└── utils/
    ├── validation.ts — Path validation, input sanitization
    └── enums.ts      — Severity, Category, Status mappings
```

## Dependencies

- `@modelcontextprotocol/sdk` — MCP server SDK
- `child_process` (Node.js built-in) — PowerShell/MpCmdRun execution
- No native addons required for v1

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFENDER_MAX_CONCURRENT_SCANS` | `4` | Max parallel scan jobs |
| `DEFENDER_SCAN_TIMEOUT_MS` | `300000` | Scan timeout (5 min) |
| `DEFENDER_ALLOWED_PATHS` | `*` | Comma-separated allowed scan directories |
| `DEFENDER_CACHE_TTL_MS` | `60000` | Result cache TTL |
| `DEFENDER_USE_MPCMDRUN` | `false` | Force MpCmdRun.exe fallback |
