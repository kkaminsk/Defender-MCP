import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('child_process', () => ({
  execFile: vi.fn((cmd: string, args: string[], opts: unknown, cb: Function) => {
    cb(null, '{"mock": true}', '');
    return { pid: 1234 };
  }),
}));

// Don't mock fs/promises — let it actually write/delete temp files

describe('runPowerShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns stdout from powershell execution', async () => {
    const { runPowerShell } = await import('../src/powershell.js');
    const result = await runPowerShell('Write-Output "test"', 5000);
    expect(result).toBe('{"mock": true}');
  });

  it('calls execFile with correct args', async () => {
    const { runPowerShell } = await import('../src/powershell.js');
    const { execFile } = await import('child_process');
    await runPowerShell('Get-Date', 5000);
    expect(execFile).toHaveBeenCalled();
    const callArgs = (execFile as any).mock.calls[0];
    expect(callArgs[1]).toContain('-NoProfile');
    expect(callArgs[1]).toContain('-NonInteractive');
    expect(callArgs[1]).toContain('-ExecutionPolicy');
    expect(callArgs[1]).toContain('RemoteSigned');
    expect(callArgs[1]).toContain('-File');
  });

  it('handles powershell errors', async () => {
    const { execFile } = await import('child_process');
    (execFile as any).mockImplementationOnce((cmd: string, args: string[], opts: any, cb: Function) => {
      cb(new Error('PowerShell failed'), '', 'error details');
      return { pid: 1234 };
    });
    const { runPowerShell } = await import('../src/powershell.js');
    await expect(runPowerShell('bad-command', 5000)).rejects.toThrow('error details');
  });

  it('treats non-empty stderr as failure even without process error', async () => {
    const { execFile } = await import('child_process');
    (execFile as ReturnType<typeof vi.fn>).mockImplementationOnce(
      (cmd: string, args: string[], opts: unknown, cb: Function) => {
        cb(null, '', 'non-terminating error');
        return { pid: 1234 };
      }
    );
    const { runPowerShell } = await import('../src/powershell.js');
    await expect(runPowerShell('Write-Error test', 5000)).rejects.toThrow('non-terminating error');
  });

  it('handles timeout', async () => {
    const { execFile } = await import('child_process');
    (execFile as any).mockImplementationOnce((cmd: string, args: string[], opts: any, cb: Function) => {
      const err: any = new Error('timeout');
      err.killed = true;
      cb(err, '', '');
      return { pid: 1234 };
    });
    const { runPowerShell } = await import('../src/powershell.js');
    await expect(runPowerShell('slow-command', 100)).rejects.toThrow('Scan timed out');
  });
});
