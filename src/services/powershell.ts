import { spawn } from 'node:child_process';
import { PowerShellResult } from '../types/index.js';

export async function runPowerShell(command: string, timeoutMs: number = 30000): Promise<PowerShellResult> {
  return new Promise((resolve) => {
    const proc = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy', 'Bypass',
      '-Command', command,
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill('SIGTERM');
      resolve({ success: false, stdout, stderr: 'Command timed out', exitCode: null });
    }, timeoutMs);

    proc.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
    proc.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

    proc.on('close', (exitCode) => {
      clearTimeout(timer);
      if (!killed) {
        resolve({ success: exitCode === 0, stdout, stderr, exitCode });
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      if (!killed) {
        resolve({ success: false, stdout, stderr: err.message, exitCode: null });
      }
    });
  });
}

export async function runPowerShellJson<T>(command: string, timeoutMs?: number): Promise<T> {
  const wrappedCommand = `${command} | ConvertTo-Json -Depth 10 -Compress`;
  const result = await runPowerShell(wrappedCommand, timeoutMs);
  if (!result.success) {
    throw new Error(`PowerShell error: ${result.stderr || 'Unknown error'} (exit code: ${result.exitCode})`);
  }
  const trimmed = result.stdout.trim();
  if (!trimmed) {
    throw new Error('PowerShell returned empty output');
  }
  return JSON.parse(trimmed) as T;
}
