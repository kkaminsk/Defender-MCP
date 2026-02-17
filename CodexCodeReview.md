# Defender-MCP Code Audit

## Scope
Full repository audit of source code, tests, configuration, and documentation, focused on security, TypeScript/Node best practices, MCP compliance, code quality, operations, and docs accuracy.

## Method and Limitations
- Static review completed across all repository files.
- Runtime validation was attempted but blocked in this environment:
  - `npm run build` failed because `tsc` was not available.
  - `npm test` failed because `vitest` was not available.
  - `npm install` failed with OS-level `EPERM` process/directory errors.

## Findings

### High

#### 1) PowerShell command failures can be reported as success (silent failure path)
- Category: Security, Reliability, MCP error semantics
- Evidence:
  - `src/powershell.ts:19-28` resolves success whenever `execFile` returns `error === null`, even if `stderr` contains command errors.
  - `src/tools/scan-file.ts:35` and `src/tools/quick-scan.ts:8` call Defender cmdlets without forcing terminating errors.
- Risk:
  - PowerShell non-terminating errors may not fail the process, resulting in `scanned: true` or `completed: true` despite underlying failure.
  - MCP `isError` can be false for failed operations.
- Recommendation:
  - In scripts, set `$ErrorActionPreference = 'Stop'` or apply `-ErrorAction Stop` on Defender cmdlets.
  - In `runPowerShell`, treat non-empty `stderr` as failure unless explicitly whitelisted.
  - Add tests for non-terminating PowerShell errors to verify `isError: true` behavior.

#### 2) `-ExecutionPolicy Bypass` weakens host policy controls
- Category: Security hardening / enterprise compliance
- Evidence:
  - `src/powershell.ts:17` executes every script with `-ExecutionPolicy Bypass`.
- Risk:
  - Reduces enterprise policy protections and may violate baseline security controls.
- Recommendation:
  - Default to no override (or `-ExecutionPolicy RemoteSigned`) and make bypass opt-in via an explicit environment flag.
  - Document the security tradeoff in `README.md`.

#### 3) Arbitrary absolute path scanning allows filesystem probing
- Category: Security, input authorization
- Evidence:
  - `src/validation.ts:11-20` validates format but does not restrict roots.
  - `src/tools/scan-file.ts:31-33` returns `File not found: <path>`, confirming file existence for any absolute path.
- Risk:
  - If exposed to untrusted MCP clients, this becomes a file-existence oracle across the host filesystem.
- Recommendation:
  - Add configurable allowlisted roots (for example, `DEFENDER_ALLOWED_PATHS`) and enforce canonicalized path checks.
  - Return generic errors for unauthorized paths to reduce host information leakage.

### Medium

#### 4) Timeout env vars are not validated (NaN/invalid values propagate)
- Category: Operational safety, robustness
- Evidence:
  - `src/tools/scan-file.ts:5`
  - `src/tools/quick-scan.ts:4`
- Risk:
  - Invalid env values can lead to undefined timeout behavior.
- Recommendation:
  - Centralize env parsing with strict numeric validation, min/max bounds, and safe defaults.

#### 5) `get_status` date handling can throw on null/empty Defender fields
- Category: Reliability, error handling
- Evidence:
  - `src/tools/get-status.ts:22-24` unconditionally calls `.ToUniversalTime()`.
- Risk:
  - Missing scan timestamps can throw and force all status fields to fallback defaults, hiding partial valid state.
- Recommendation:
  - Null-check these values in PowerShell and emit nullable/empty-safe fields.
  - Preserve successfully retrieved fields even when optional dates are missing.

#### 6) Direct `zod` import is undeclared in project dependencies
- Category: Dependency hygiene
- Evidence:
  - `src/server.ts:2` imports `zod` directly.
  - `package.json:20-22` does not declare `zod`.
- Risk:
  - Works only because transitive dependency layout currently exposes `zod`; can break with different package managers or future lock changes.
- Recommendation:
  - Add `zod` as a direct dependency with an explicit version range.

#### 7) MCP response format is text-only JSON strings (reduced interoperability)
- Category: MCP protocol ergonomics/compliance quality
- Evidence:
  - `src/server.ts:20`, `src/server.ts:31`, `src/server.ts:42` return `{ type: 'text', text: JSON.stringify(...) }`.
- Risk:
  - Clients must parse JSON embedded in text; typed interop and schema-driven clients are harder to implement.
- Recommendation:
  - Prefer structured result content where SDK/client supports it, or at minimum publish stable output schemas and keep text JSON strictly versioned.

#### 8) Documentation is materially inconsistent with implementation
- Category: Documentation accuracy
- Evidence:
  - `Architecture.md:66-74` documents 7 tools; implementation registers 3 in `src/server.ts:13-44`.
  - `Architecture.md:132` says admin required, while `README.md:45` says not required.
  - `Architecture.md:159-180` references files/modules that do not exist in repository.
  - `openspec/changes/initial-implementation/tasks.md:15-31` marks features/tests complete that are absent.
- Risk:
  - Misleads operators and maintainers; increases integration and security expectation gaps.
- Recommendation:
  - Align all docs to current behavior, or clearly split into "current" vs "future roadmap".
  - Remove completed checkmarks for unimplemented items.

#### 9) Core functionality lacks direct tests
- Category: Code quality, regression risk
- Evidence:
  - Existing tests only cover validation and PowerShell wrapper: `tests/validation.test.ts:1-39`, `tests/powershell.test.ts:1-57`.
  - No tests for `scan_file`, `quick_scan`, `get_status`, or server-level MCP handlers.
- Risk:
  - Behavioral regressions in tool output, error mapping, and `isError` semantics will go undetected.
- Recommendation:
  - Add unit tests for each tool handler with mocked `runPowerShell`.
  - Add integration tests for `createServer()` tool registration and response envelopes.

### Low

#### 10) Type safety weakened by `any` in production paths
- Category: TypeScript best practices
- Evidence:
  - `src/powershell.ts:21`
  - `src/tools/scan-file.ts:61`, `src/tools/scan-file.ts:73`
  - `src/tools/quick-scan.ts:16`
  - `src/tools/get-status.ts:36`
- Risk:
  - Runtime shape mismatches become easier to miss; static guarantees are diluted.
- Recommendation:
  - Replace `any` with typed error guards and explicit interfaces for parsed PowerShell payloads.

#### 11) No graceful shutdown handling
- Category: Operations
- Evidence:
  - `src/index.ts:5-13` starts server but does not handle `SIGINT`/`SIGTERM` for cleanup/disconnect.
- Risk:
  - Abrupt shutdown can interrupt scans and reduce operational predictability.
- Recommendation:
  - Add signal handlers that close transport/server cleanly and flush final logs.

#### 12) Build/test quality gates are minimal
- Category: Build pipeline, maintainability
- Evidence:
  - `package.json:10-16` only includes basic build/test scripts.
  - No lint/typecheck/CI workflow files are present in repo.
- Risk:
  - Lower protection against style drift, type regressions, and dependency/security issues.
- Recommendation:
  - Add `lint` and `typecheck` scripts and enforce them in CI.
  - Add dependency audit checks in CI (`npm audit` or equivalent policy tooling).

## Positive Notes
- Uses `execFile` (not shell string execution), reducing command injection risk in process invocation: `src/powershell.ts:15-18`.
- Temporary PowerShell script files are cleaned up in `finally`: `src/powershell.ts:32-34`.
- Basic file path validation blocks relative paths, UNC paths, traversal markers, and null bytes: `src/validation.ts:5-20`.

## Recommended Remediation Order
1. Fix PowerShell failure semantics (`ErrorAction`, `stderr` handling) and verify MCP `isError` correctness.
2. Remove or gate `-ExecutionPolicy Bypass`.
3. Add path allowlisting and reduce filesystem-probing leakage.
4. Add missing direct dependency declarations and env validation.
5. Expand tests for tool handlers and MCP integration.
6. Reconcile all documentation with current implementation.
