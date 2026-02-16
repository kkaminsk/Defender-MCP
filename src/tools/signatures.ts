import { DefenderService } from '../services/defender.js';

export function registerSignatureTools(server: any, defender: DefenderService) {
  server.tool(
    'update_signatures',
    'Trigger Windows Defender signature definition update',
    {},
    async () => {
      try {
        const result = await defender.updateSignatures();
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error updating signatures: ${err instanceof Error ? err.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }
  );
}
