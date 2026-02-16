import { z } from 'zod';
import { DefenderService } from '../services/defender.js';

export function registerScanStatusTools(server: any, defender: DefenderService) {
  server.tool(
    'get_scan_status',
    'Check the status of an async scan job',
    {
      jobId: z.string().describe('The job ID returned from scan_file or quick_scan'),
    },
    async ({ jobId }: { jobId: string }) => {
      try {
        const job = await defender.getScanStatus(jobId);
        if (!job) {
          return {
            content: [{ type: 'text' as const, text: `No scan job found with ID: ${jobId}` }],
            isError: true,
          };
        }

        const result = {
          jobId: job.jobId,
          status: job.status,
          scanType: job.scanType,
          scanPath: job.scanPath,
          startTime: new Date(job.startTime).toISOString(),
          endTime: job.endTime ? new Date(job.endTime).toISOString() : undefined,
          durationMs: job.endTime ? job.endTime - job.startTime : Date.now() - job.startTime,
          error: job.result?.error,
          queueStats: defender.getQueueStats(),
        };

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error checking scan status: ${err instanceof Error ? err.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }
  );
}
