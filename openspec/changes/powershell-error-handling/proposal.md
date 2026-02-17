# Proposal: PowerShell Error Handling

## Summary
Harden PowerShell execution semantics so Defender command failures always surface as MCP errors.

## Motivation
Non-terminating PowerShell errors and permissive process handling could produce false success responses.

## Scope
- Add `$ErrorActionPreference = 'Stop'` in all PowerShell scripts.
- Treat non-empty stderr as failure in `runPowerShell`.
- Change default execution policy from `Bypass` to `RemoteSigned`.
- Support explicit override with `DEFENDER_EXECUTION_POLICY`.
