# Proposal: Security Hardening

## Summary
Restrict scan scope to configured safe roots and harden env-based runtime configuration parsing.

## Motivation
Unrestricted absolute paths and unvalidated timeout values increase attack surface and operational risk.

## Scope
- Add `DEFENDER_ALLOWED_PATHS` allowlist enforcement for `scan_file`.
- Canonicalize and validate allowed roots and candidate file paths.
- Return generic unauthorized path errors.
- Centralize timeout parsing with bounds checking.
