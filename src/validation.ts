import path from 'path';
import { ValidationResult } from './types.js';

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
  return { valid: true };
}
