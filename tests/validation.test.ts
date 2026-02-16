import { describe, it, expect } from 'vitest';
import { validatePath, sanitizeString } from '../src/utils/validation.js';
import { Config } from '../src/types/index.js';

const defaultConfig: Config = {
  maxConcurrentScans: 4,
  scanTimeoutMs: 300000,
  allowedPaths: ['*'],
  cacheTtlMs: 60000,
  useMpCmdRun: false,
};

const restrictedConfig: Config = {
  ...defaultConfig,
  allowedPaths: ['C:\\Users\\test', 'D:\\scans'],
};

describe('validatePath', () => {
  it('accepts valid absolute paths', () => {
    const result = validatePath('C:\\Users\\test\\file.exe', defaultConfig);
    expect(result.valid).toBe(true);
    expect(result.normalized).toBeTruthy();
  });

  it('rejects empty paths', () => {
    expect(validatePath('', defaultConfig).valid).toBe(false);
    expect(validatePath('   ', defaultConfig).valid).toBe(false);
  });

  it('rejects path traversal', () => {
    expect(validatePath('C:\\Users\\..\\Windows\\System32', defaultConfig).valid).toBe(false);
    expect(validatePath('..\\..\\etc\\passwd', defaultConfig).valid).toBe(false);
    expect(validatePath('C:\\test\\..', defaultConfig).valid).toBe(false);
  });

  it('rejects UNC paths', () => {
    expect(validatePath('\\\\server\\share\\file', defaultConfig).valid).toBe(false);
    expect(validatePath('//server/share/file', defaultConfig).valid).toBe(false);
  });

  it('rejects null bytes', () => {
    expect(validatePath('C:\\test\0file', defaultConfig).valid).toBe(false);
  });

  it('enforces allowed paths', () => {
    const result = validatePath('C:\\Users\\test\\file.exe', restrictedConfig);
    expect(result.valid).toBe(true);

    const blocked = validatePath('C:\\Windows\\System32\\cmd.exe', restrictedConfig);
    expect(blocked.valid).toBe(false);
    expect(blocked.error).toContain('not in allowed directories');
  });

  it('rejects non-string input', () => {
    expect(validatePath(null as any, defaultConfig).valid).toBe(false);
    expect(validatePath(123 as any, defaultConfig).valid).toBe(false);
  });
});

describe('sanitizeString', () => {
  it('truncates long strings', () => {
    const long = 'a'.repeat(2000);
    expect(sanitizeString(long, 100).length).toBe(100);
  });

  it('removes non-printable characters', () => {
    expect(sanitizeString('hello\x00world')).toBe('helloworld');
  });

  it('handles non-string input', () => {
    expect(sanitizeString(null as any)).toBe('');
  });
});
