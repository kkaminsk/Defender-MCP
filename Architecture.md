# Defender-MCP Architecture

## Overview

Defender-MCP is a Model Context Protocol (MCP) server that exposes 3 Windows Defender tools over stdio:

- `scan_file`
- `quick_scan`
- `get_status`

The implementation uses PowerShell cmdlets only. It does not use MpCmdRun.exe, WMI/CIM, AMSI, or cloud APIs.

## Runtime Flow

1. `src/index.ts` creates the MCP server and stdio transport.
2. `src/server.ts` registers tools and maps tool results to MCP `content` and `isError`.
3. Tool handlers in `src/tools/*.ts` validate input, run PowerShell, parse JSON output, and return typed payloads.
4. `src/powershell.ts` writes a temporary `.ps1` file, executes it with `powershell.exe`, and cleans up the file.

## Tool Contracts

### `scan_file`

- Input: absolute Windows path (`file_path`)
- Validation:
  - must be absolute
  - blocks traversal markers (`..`), null bytes, and UNC paths
  - must be inside configured allowed roots (`DEFENDER_ALLOWED_PATHS`)
- Behavior:
  - invokes `Start-MpScan -ScanType CustomScan -ScanPath ...`
  - queries Defender detections for matching resource paths
  - maps Defender severity/status IDs to readable labels

### `quick_scan`

- Input: none
- Behavior:
  - invokes `Start-MpScan -ScanType QuickScan`
  - returns completion message or error

### `get_status`

- Input: none
- Behavior:
  - invokes `Get-MpComputerStatus`
  - returns service/protection status, signatures, scan timestamps, and computed computer state label

## Error Handling and Security Controls

- Every PowerShell script starts with `$ErrorActionPreference = 'Stop'` to convert non-terminating errors into terminating failures.
- `runPowerShell` treats non-empty stderr as failure.
- Execution policy defaults to `RemoteSigned`; override with `DEFENDER_EXECUTION_POLICY` when required.
- Unauthorized scan paths return generic errors to avoid disclosing filesystem details.
- Timeout environment variables are bounds-checked with safe defaults.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFENDER_POWERSHELL_PATH` | `powershell.exe` | PowerShell executable path |
| `DEFENDER_EXECUTION_POLICY` | `RemoteSigned` | Execution policy used for PowerShell invocation |
| `DEFENDER_ALLOWED_PATHS` | current working directory | Comma-separated absolute allowlist roots for `scan_file`; use `*` to disable restriction |
| `DEFENDER_FILE_SCAN_TIMEOUT_MS` | `60000` | Timeout for `scan_file` (clamped to `1000..3600000`) |
| `DEFENDER_QUICK_SCAN_TIMEOUT_MS` | `600000` | Timeout for `quick_scan` (clamped to `1000..3600000`) |
| `DEFENDER_STATUS_TIMEOUT_MS` | `30000` | Timeout for `get_status` (clamped to `1000..3600000`) |

## Repository Structure

```text
src/
├── config.ts
├── index.ts
├── powershell.ts
├── server.ts
├── tools/
│   ├── get-status.ts
│   ├── quick-scan.ts
│   └── scan-file.ts
├── types.ts
└── validation.ts
```
