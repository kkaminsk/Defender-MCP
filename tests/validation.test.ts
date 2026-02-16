import { describe, it, expect } from 'vitest';
import { validateFilePath } from '../src/validation.js';

describe('validateFilePath', () => {
  it('accepts valid absolute paths', () => {
    expect(validateFilePath('C:\\Users\\test\\file.exe')).toEqual({ valid: true });
    expect(validateFilePath('D:\\folder\\file.txt')).toEqual({ valid: true });
  });

  it('rejects relative paths', () => {
    const r = validateFilePath('relative\\path.txt');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('Path must be absolute');
  });

  it('rejects path traversal', () => {
    const r = validateFilePath('C:\\Users\\..\\secret.txt');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('Path traversal not allowed');
  });

  it('rejects UNC paths', () => {
    const r = validateFilePath('\\\\server\\share\\file.txt');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('UNC paths not allowed');
  });

  it('rejects null bytes', () => {
    const r = validateFilePath('C:\\Users\\test\0file.txt');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('Null bytes not allowed');
  });

  it('rejects empty string', () => {
    const r = validateFilePath('');
    expect(r.valid).toBe(false);
    expect(r.error).toBe('File path is required');
  });
});
