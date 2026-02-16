import { DefenderService } from '../services/defender.js';

export function registerThreatTools(server: any, defender: DefenderService) {
  server.tool(
    'get_threats',
    'List detected threats with severity, category, and remediation status',
    {},
    async () => {
      try {
        const threats = await defender.getThreats();
        return {
          content: [{
            type: 'text' as const,
            text: threats.length > 0
              ? JSON.stringify(threats, null, 2)
              : 'No active threats detected.',
          }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error getting threats: ${err instanceof Error ? err.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_threat_detections',
    'Get detailed threat detection history including timestamps and sources',
    {},
    async () => {
      try {
        const detections = await defender.getThreatDetections();
        return {
          content: [{
            type: 'text' as const,
            text: detections.length > 0
              ? JSON.stringify(detections, null, 2)
              : 'No threat detections found.',
          }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text' as const, text: `Error getting detections: ${err instanceof Error ? err.message : 'Unknown error'}` }],
          isError: true,
        };
      }
    }
  );
}
