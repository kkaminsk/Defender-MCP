# Proposal: Test Coverage

## Summary
Expand unit and registration tests for core tool handlers and MCP server wiring.

## Motivation
Current tests do not protect core handler behavior or tool registration contracts.

## Scope
- Add unit tests for `handleScanFile`, `handleQuickScan`, and `handleGetStatus` with mocked PowerShell execution.
- Add server registration tests for expected tools and error envelope behavior.
