# Proposal: Defender-MCP Specification Implementation

## Summary
Implement a lightweight MCP server with exactly 3 tools: `scan_file`, `quick_scan`, and `get_status`. All Defender interaction uses PowerShell cmdlets only (no MpCmdRun.exe, no WMI, no AMSI).

## Motivation
Provide AI agents with safe, scoped access to Windows Defender scanning and status via the Model Context Protocol over stdio transport.

## Approach
- Clean TypeScript implementation with minimal dependencies
- PowerShell execution via temp .ps1 files for reliable argument passing
- Path validation to prevent traversal, UNC, and injection attacks
- All errors returned as MCP tool results (never crashes)
