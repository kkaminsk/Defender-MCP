import { Config } from './types/index.js';

export function loadConfig(): Config {
  const allowedPathsRaw = process.env.DEFENDER_ALLOWED_PATHS ?? '*';
  const allowedPaths = allowedPathsRaw === '*' ? ['*'] : allowedPathsRaw.split(',').map(p => p.trim()).filter(Boolean);

  return {
    maxConcurrentScans: parseInt(process.env.DEFENDER_MAX_CONCURRENT_SCANS ?? '4', 10),
    scanTimeoutMs: parseInt(process.env.DEFENDER_SCAN_TIMEOUT_MS ?? '300000', 10),
    allowedPaths,
    cacheTtlMs: parseInt(process.env.DEFENDER_CACHE_TTL_MS ?? '60000', 10),
    useMpCmdRun: process.env.DEFENDER_USE_MPCMDRUN === 'true',
  };
}
