import { describe, it, expect } from 'vitest';
import { validateFilePath } from '../src/validation.js';

describe('validateFilePath', () => {
  it('accepts valid absolute paths', () => {
    process.env.DEFENDER_ALLOWED_PATHS = '*';
    expect(validateFilePath('C:\\Users\\test\\file.exe')).toEqual({ valid: true });
    expect(validateFilePath('D:\\folder\\file.txt')).toEqual({ valid: true });
  });

  it('rejects relative paths', () => {
    process.env.DEFENDER_ALLOWED_PATHS = '*';
    const r = validateFilePath('relative\\path.txt');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('Path must be absolute');
  });

  it('rejects path traversal', () => {
    process.env.DEFENDER_ALLOWED_PATHS = '*';
    const r = validateFilePath('C:\\Users\\..\\secret.txt');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('Path traversal not allowed');
  });

  it('rejects UNC paths', () => {
    process.env.DEFENDER_ALLOWED_PATHS = '*';
    const r = validateFilePath('\\\\server\\share\\file.txt');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('UNC paths not allowed');
  });

  it('rejects null bytes', () => {
    process.env.DEFENDER_ALLOWED_PATHS = '*';
    const r = validateFilePath('C:\\Users\\test\0file.txt');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('Null bytes not allowed');
  });

  it('rejects empty string', () => {
    process.env.DEFENDER_ALLOWED_PATHS = '*';
    const r = validateFilePath('');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('File path is required');
  });

  it('rejects paths outside allowed roots with generic error', () => {
    process.env.DEFENDER_ALLOWED_PATHS = 'C:\\Temp\\Allowed';
    const r = validateFilePath('C:\\Temp\\Blocked\\file.txt');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('Path is not authorized for scanning');
  });
});
