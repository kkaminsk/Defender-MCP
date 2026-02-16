import { DefenderService } from '../services/defender.js';

export function registerStatusTools(server: any, defender: DefenderService) {
  server.tool(
    'get_defender_status',
    'Get Windows Defender protection status, signature versions, and feature states',
    {},
    async () => {
      try {
        const status = await defender.getComputerStatus();
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(status, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error getting status: ${err instanceof Error ? err.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }
  );
}
