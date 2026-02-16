import { execFile } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

const POWERSHELL_PATH = process.env.DEFENDER_POWERSHELL_PATH || 'powershell.exe';

export async function runPowerShell(script: string, timeoutMs: number): Promise<string> {
  const tempFile = path.join(tmpdir(), `defender-mcp-${randomUUID()}.ps1`);
  await writeFile(tempFile, script, 'utf-8');

  try {
    return await new Promise<string>((resolve, reject) => {
      const proc = execFile(
        POWERSHELL_PATH,
        ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', tempFile],
        { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024, windowsHide: true },
        (error, stdout, stderr) => {
          if (error) {
            if ((error as any).killed || (error as any).signal === 'SIGTERM') {
              reject(new Error('Scan timed out'));
            } else {
              reject(new Error(stderr?.trim() || error.message));
            }
          } else {
            resolve(stdout);
          }
        }
      );
    });
  } finally {
    await unlink(tempFile).catch(() => {});
  }
}
