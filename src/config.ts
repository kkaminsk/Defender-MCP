import path from 'path';

const DEFAULT_FILE_SCAN_TIMEOUT_MS = 60_000;
const DEFAULT_QUICK_SCAN_TIMEOUT_MS = 600_000;
const DEFAULT_STATUS_TIMEOUT_MS = 30_000;
const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 3_600_000;
const DEFAULT_EXECUTION_POLICY = 'RemoteSigned';

function parseBoundedInt(
  value: string | undefined,
  defaultValue: number,
  min: number,
  max: number
): number {
  if (!value) {
    return defaultValue;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return defaultValue;
  }
  return Math.min(Math.max(parsed, min), max);
}

function normalizeAbsolutePath(rawPath: string): string | null {
  const trimmed = rawPath.trim();
  if (!trimmed || trimmed === '*') {
    return null;
  }
  if (!path.isAbsolute(trimmed)) {
    return null;
  }
  return path.resolve(trimmed);
}

export function getFileScanTimeoutMs(): number {
  return parseBoundedInt(
    process.env.DEFENDER_FILE_SCAN_TIMEOUT_MS,
    DEFAULT_FILE_SCAN_TIMEOUT_MS,
    MIN_TIMEOUT_MS,
    MAX_TIMEOUT_MS
  );
}

export function getQuickScanTimeoutMs(): number {
  return parseBoundedInt(
    process.env.DEFENDER_QUICK_SCAN_TIMEOUT_MS,
    DEFAULT_QUICK_SCAN_TIMEOUT_MS,
    MIN_TIMEOUT_MS,
    MAX_TIMEOUT_MS
  );
}

export function getStatusTimeoutMs(): number {
  return parseBoundedInt(
    process.env.DEFENDER_STATUS_TIMEOUT_MS,
    DEFAULT_STATUS_TIMEOUT_MS,
    MIN_TIMEOUT_MS,
    MAX_TIMEOUT_MS
  );
}

export function getExecutionPolicy(): string {
  const value = process.env.DEFENDER_EXECUTION_POLICY?.trim();
  return value || DEFAULT_EXECUTION_POLICY;
}

export function getAllowedScanRoots(): string[] {
  const raw = process.env.DEFENDER_ALLOWED_PATHS;
  if (!raw || !raw.trim()) {
    return [path.resolve(process.cwd())];
  }
  if (
    raw
      .split(',')
      .map((entry) => entry.trim())
      .includes('*')
  ) {
    return ['*'];
  }

  const normalized = raw
    .split(',')
    .map(normalizeAbsolutePath)
    .filter((entry): entry is string => entry !== null);

  if (normalized.length === 0) {
    return [path.resolve(process.cwd())];
  }

  return Array.from(new Set(normalized));
}
