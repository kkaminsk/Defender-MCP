import { z } from 'zod';
import { DefenderService } from '../services/defender.js';
import { Config } from '../types/index.js';
import { validatePath } from '../utils/validation.js';

export function registerScanTools(server: any, defender: DefenderService, config: Config) {
  server.tool(
    'scan_file',
    'Scan a specific file or directory with Windows Defender',
    {
      path: z.string().describe('File or directory path to scan'),
    },
    async ({ path: scanPath }: { path: string }) => {
      const validation = validatePath(scanPath, config);
      if (!validation.valid) {
        return {
          content: [{ type: 'text' as const, text: `Error: ${validation.error}` }],
          isError: true,
        };
      }

      try {
        const job = await defender.startScan(validation.normalized!, 'CustomScan');
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              jobId: job.jobId,
              status: job.status,
              scanPath: validation.normalized,
              message: 'Scan initiated. Use get_scan_status with the jobId to check progress.',
            }, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error starting scan: ${err instanceof Error ? err.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'quick_scan',
    'Run a quick system-wide Windows Defender scan',
    {},
    async () => {
      try {
        const job = await defender.startScan(undefined, 'QuickScan');
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              jobId: job.jobId,
              status: job.status,
              message: 'Quick scan initiated. Use get_scan_status with the jobId to check progress.',
            }, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error starting quick scan: ${err instanceof Error ? err.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }
  );
}
