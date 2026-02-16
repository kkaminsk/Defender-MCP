# CLAUDE.md — Defender-MCP

## What is this?

TypeScript MCP server exposing Windows Defender scanning via stdio transport. Uses PowerShell cmdlets (primary) with MpCmdRun.exe fallback.

## Build & Test

```bash
npm install
npm run build    # TypeScript → dist/
npm test         # vitest
```

## Architecture

- `src/index.ts` — Entry point, stdio transport
- `src/server.ts` — MCP server, tool registration
- `src/tools/` — One file per tool group (scan, status, threats, signatures, scan-status)
- `src/services/powershell.ts` — Spawns PowerShell, parses JSON output
- `src/services/queue.ts` — Bounded concurrent scan queue
- `src/utils/validation.ts` — Path sanitization, traversal prevention
- `src/utils/enums.ts` — Threat severity/category/status mappings

## Key Design Decisions

- PowerShell `-AsJob` for async scans, poll with `get_scan_status`
- Never read/execute scanned files — only pass paths to Defender
- Max 4 concurrent scans, MpCmdRun serialized
- Admin privileges required for scanning
- All paths validated (no traversal, no UNC by default)
