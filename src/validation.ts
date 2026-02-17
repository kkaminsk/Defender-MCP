import path from 'path';
import { ValidationResult } from './types.js';
import { getAllowedScanRoots } from './config.js';

const UNAUTHORIZED_PATH_ERROR = 'Path is not authorized for scanning';

function normalizeForComparison(inputPath: string): string {
  const resolved = path.resolve(inputPath);
  return resolved.replace(/[\\\/]+$/, '').toLowerCase();
}

function isAllowedPath(filePath: string): boolean {
  const allowedRoots = getAllowedScanRoots();
  if (allowedRoots.includes('*')) {
    return true;
  }
  const normalizedPath = normalizeForComparison(filePath);

  return allowedRoots.some((root) => {
    const normalizedRoot = normalizeForComparison(root);
    return (
      normalizedPath === normalizedRoot ||
      normalizedPath.startsWith(`${normalizedRoot}${path.sep.toLowerCase()}`)
    );
  });
}

export function validateFilePath(filePath: string): ValidationResult {
  if (!filePath || typeof filePath !== 'string') {
    return { valid: false, error: 'File path is required' };
  }
  if (filePath.includes('\0')) {
    return { valid: false, error: 'Null bytes not allowed' };
  }
  if (!path.isAbsolute(filePath)) {
    return { valid: false, error: 'Path must be absolute' };
  }
  if (filePath.includes('..')) {
    return { valid: false, error: 'Path traversal not allowed' };
  }
  if (filePath.startsWith('\\\\')) {
    return { valid: false, error: 'UNC paths not allowed' };
  }
  if (!isAllowedPath(filePath)) {
    return { valid: false, error: UNAUTHORIZED_PATH_ERROR };
  }
  return { valid: true };
}
