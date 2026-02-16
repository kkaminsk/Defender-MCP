# CLAUDE.md - Defender-MCP

## What This Is
MCP server exposing 3 Windows Defender tools via PowerShell over stdio transport.

## Tools
- `scan_file` — scan a single file (requires absolute path, validates against traversal/UNC/null bytes)
- `quick_scan` — trigger Defender quick scan (no params, blocks up to 10 min)
- `get_status` — report Defender state (signatures, protection, last scan times)

## Architecture
- TypeScript, `@modelcontextprotocol/sdk` for MCP
- PowerShell execution via temp .ps1 files (avoids argument escaping issues)
- All output is JSON via `ConvertTo-Json`

## Key Rules
- PowerShell only — no MpCmdRun.exe, no WMI, no AMSI
- No admin required
- Read-only + scan (never modifies Defender settings)
- All errors returned as MCP tool results with `isError: true`

## Build & Test
```bash
npm install && npm run build && npm test
```
