import path from 'node:path';
import { Config } from '../types/index.js';

const TRAVERSAL_PATTERNS = [/\.\.[\\/]/, /\.\.$/];
const UNC_PATTERN = /^\\\\|^\/\//;

export function validatePath(inputPath: string, config: Config): { valid: boolean; error?: string; normalized?: string } {
  if (!inputPath || typeof inputPath !== 'string') {
    return { valid: false, error: 'Path is required and must be a string' };
  }

  const trimmed = inputPath.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Path cannot be empty' };
  }

  if (trimmed.length > 32767) {
    return { valid: false, error: 'Path exceeds maximum length' };
  }

  // Block UNC paths
  if (UNC_PATTERN.test(trimmed)) {
    return { valid: false, error: 'UNC paths are not allowed' };
  }

  // Block traversal
  for (const pattern of TRAVERSAL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Path traversal is not allowed' };
    }
  }

  const normalized = path.resolve(trimmed);

  // Check allowed paths
  if (config.allowedPaths.length > 0 && config.allowedPaths[0] !== '*') {
    const isAllowed = config.allowedPaths.some(allowed => {
      const normalizedAllowed = path.resolve(allowed);
      return normalized.startsWith(normalizedAllowed);
    });
    if (!isAllowed) {
      return { valid: false, error: `Path is not in allowed directories: ${config.allowedPaths.join(', ')}` };
    }
  }

  // Block null bytes
  if (trimmed.includes('\0')) {
    return { valid: false, error: 'Path contains null bytes' };
  }

  return { valid: true, normalized };
}

export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  return input.slice(0, maxLength).replace(/[^\x20-\x7E]/g, '');
}
