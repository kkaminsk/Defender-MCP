import { execFile } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { getExecutionPolicy } from './config.js';

const POWERSHELL_PATH = process.env.DEFENDER_POWERSHELL_PATH || 'powershell.exe';

interface ProcessError extends Error {
  killed?: boolean;
  signal?: NodeJS.Signals | null;
}

export async function runPowerShell(script: string, timeoutMs: number): Promise<string> {
  const tempFile = path.join(tmpdir(), `defender-mcp-${randomUUID()}.ps1`);
  await writeFile(tempFile, script, 'utf-8');

  try {
    return await new Promise<string>((resolve, reject) => {
      const proc = execFile(
        POWERSHELL_PATH,
        ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', getExecutionPolicy(), '-File', tempFile],
        { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024, windowsHide: true },
        (error, stdout, stderr) => {
          const stderrText = stderr.trim();
          if (error) {
            const processError = error as ProcessError;
            if (processError.killed || processError.signal === 'SIGTERM') {
              reject(new Error('Scan timed out'));
            } else {
              reject(new Error(stderrText || error.message));
            }
          } else if (stderrText) {
            reject(new Error(stderrText));
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
