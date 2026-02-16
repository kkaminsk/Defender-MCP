import { randomUUID } from 'node:crypto';
import { runPowerShell, runPowerShellJson } from './powershell.js';
import { ScanQueue } from './queue.js';
import { Config, ScanJob, ComputerStatus, ThreatInfo, ThreatDetection, SignatureUpdateResult } from '../types/index.js';
import { getSeverityName, getThreatStatusName, getCleaningActionName, getTypeName, getCategoryName, getDetectionSourceName } from '../utils/enums.js';

export class DefenderService {
  private queue: ScanQueue;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.queue = new ScanQueue({
      maxConcurrent: config.maxConcurrentScans,
      timeoutMs: config.scanTimeoutMs,
    });
  }

  async startScan(scanPath: string | undefined, scanType: 'CustomScan' | 'QuickScan'): Promise<ScanJob> {
    const jobId = randomUUID();
    const job: ScanJob = {
      jobId,
      psJobId: -1,
      scanType,
      scanPath,
      status: 'queued',
      startTime: Date.now(),
    };
    this.queue.setJob(job);

    await this.queue.enqueue(jobId, async () => {
      job.status = 'running';
      this.queue.setJob(job);

      try {
        let cmd: string;
        if (scanType === 'CustomScan' && scanPath) {
          const escaped = scanPath.replace(/'/g, "''");
          cmd = `$job = Start-MpScan -ScanType CustomScan -ScanPath '${escaped}' -AsJob; $job.Id`;
        } else {
          cmd = `$job = Start-MpScan -ScanType QuickScan -AsJob; $job.Id`;
        }

        const result = await runPowerShell(cmd, this.config.scanTimeoutMs);
        if (result.success) {
          const psJobId = parseInt(result.stdout.trim(), 10);
          if (!isNaN(psJobId)) {
            job.psJobId = psJobId;
          }
          job.status = 'completed';
        } else {
          job.status = 'failed';
          job.result = {
            jobId,
            status: 'failed',
            scanType,
            scanPath,
            startTime: new Date(job.startTime).toISOString(),
            error: result.stderr || 'Scan failed',
          };
        }
      } catch (err) {
        job.status = 'failed';
        job.result = {
          jobId,
          status: 'failed',
          scanType,
          scanPath,
          startTime: new Date(job.startTime).toISOString(),
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }

      job.endTime = Date.now();
      this.queue.setJob(job);
    });

    return job;
  }

  async getScanStatus(jobId: string): Promise<ScanJob | undefined> {
    const job = this.queue.getJob(jobId);
    if (!job) return undefined;

    if (job.status === 'running' && job.psJobId >= 0) {
      try {
        const result = await runPowerShell(`(Get-Job -Id ${job.psJobId}).State`);
        const state = result.stdout.trim().toLowerCase();
        if (state === 'completed') {
          job.status = 'completed';
          job.endTime = Date.now();
          this.queue.setJob(job);
        } else if (state === 'failed') {
          job.status = 'failed';
          job.endTime = Date.now();
          this.queue.setJob(job);
        }
      } catch {
        // Job may have been cleaned up
      }
    }

    return job;
  }

  async getComputerStatus(): Promise<ComputerStatus> {
    const raw = await runPowerShellJson<Record<string, unknown>>('Get-MpComputerStatus');
    return {
      antivirusEnabled: raw['AntivirusEnabled'] as boolean ?? false,
      antivirusSignatureLastUpdated: String(raw['AntivirusSignatureLastUpdated'] ?? ''),
      antivirusSignatureVersion: String(raw['AntivirusSignatureVersion'] ?? ''),
      antispywareEnabled: raw['AntispywareEnabled'] as boolean ?? false,
      behaviorMonitorEnabled: raw['BehaviorMonitorEnabled'] as boolean ?? false,
      ioavProtectionEnabled: raw['IoavProtectionEnabled'] as boolean ?? false,
      nISEnabled: raw['NISEnabled'] as boolean ?? false,
      onAccessProtectionEnabled: raw['OnAccessProtectionEnabled'] as boolean ?? false,
      realTimeProtectionEnabled: raw['RealTimeProtectionEnabled'] as boolean ?? false,
      tamperProtectionSource: String(raw['TamperProtectionSource'] ?? 'Unknown'),
      quickScanAge: raw['QuickScanAge'] as number ?? -1,
      fullScanAge: raw['FullScanAge'] as number ?? -1,
      defenderServiceStatus: String(raw['AMServiceEnabled'] ? 'Running' : 'Stopped'),
      amRunningMode: String(raw['AMRunningMode'] ?? 'Unknown'),
    };
  }

  async getThreats(): Promise<ThreatInfo[]> {
    try {
      const raw = await runPowerShellJson<Record<string, unknown>[]>('Get-MpThreat');
      const threats = Array.isArray(raw) ? raw : [raw];
      return threats.map(t => ({
        threatId: String(t['ThreatID'] ?? ''),
        threatName: String(t['ThreatName'] ?? ''),
        severityId: t['SeverityID'] as number ?? 0,
        severityName: getSeverityName(t['SeverityID'] as number ?? 0),
        categoryId: t['CategoryID'] as number ?? 0,
        categoryName: getCategoryName(t['CategoryID'] as number ?? 0),
        typeId: t['TypeID'] as number ?? 0,
        typeName: getTypeName(t['TypeID'] as number ?? 0),
        statusId: t['ThreatStatusID'] as number ?? 0,
        statusName: getThreatStatusName(t['ThreatStatusID'] as number ?? 0),
        cleaningActionId: t['CleaningActionID'] as number ?? 0,
        cleaningActionName: getCleaningActionName(t['CleaningActionID'] as number ?? 0),
        resources: Array.isArray(t['Resources']) ? t['Resources'].map(String) : [],
      }));
    } catch {
      return [];
    }
  }

  async getThreatDetections(): Promise<ThreatDetection[]> {
    try {
      const raw = await runPowerShellJson<Record<string, unknown>[]>('Get-MpThreatDetection');
      const detections = Array.isArray(raw) ? raw : [raw];
      return detections.map(d => ({
        threatId: String(d['ThreatID'] ?? ''),
        threatName: String(d['ThreatName'] ?? ''),
        processName: String(d['ProcessName'] ?? ''),
        detectionSourceTypeId: d['DetectionSourceTypeID'] as number ?? 0,
        detectionSourceName: getDetectionSourceName(d['DetectionSourceTypeID'] as number ?? 0),
        initialDetectionTime: String(d['InitialDetectionTime'] ?? ''),
        lastThreatStatusChangeTime: String(d['LastThreatStatusChangeTime'] ?? ''),
        remediationTime: d['RemediationTime'] ? String(d['RemediationTime']) : undefined,
        resources: Array.isArray(d['Resources']) ? d['Resources'].map(String) : [],
        additionalActionsBitMask: d['AdditionalActionsBitMask'] as number ?? 0,
      }));
    } catch {
      return [];
    }
  }

  async updateSignatures(): Promise<SignatureUpdateResult> {
    try {
      const beforeResult = await runPowerShell(
        `(Get-MpComputerStatus).AntivirusSignatureVersion`
      );
      const previousVersion = beforeResult.stdout.trim();

      const updateResult = await runPowerShell('Update-MpSignature', 120000);
      if (!updateResult.success) {
        return { success: false, error: updateResult.stderr || 'Update failed' };
      }

      const afterResult = await runPowerShell(
        `(Get-MpComputerStatus).AntivirusSignatureVersion`
      );
      const currentVersion = afterResult.stdout.trim();

      return { success: true, previousVersion, currentVersion };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  getQueueStats() {
    return this.queue.stats;
  }
}
