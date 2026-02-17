# Tasks

- [x] Add `$ErrorActionPreference = 'Stop'` to `scan_file`, `quick_scan`, and `get_status` scripts.
- [x] Update `runPowerShell` to fail on non-empty stderr.
- [x] Replace default `-ExecutionPolicy Bypass` with `RemoteSigned`.
- [x] Add `DEFENDER_EXECUTION_POLICY` override support.
- [x] Update tests for execution policy and stderr-failure behavior.
