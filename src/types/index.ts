export interface ScanRequest {
  scanPath: string;
  scanType: 'CustomScan' | 'QuickScan' | 'FullScan';
}

export interface ScanResult {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'timeout';
  scanPath?: string;
  scanType: string;
  startTime: string;
  endTime?: string;
  threatsFound?: ThreatInfo[];
  error?: string;
}

export interface ThreatInfo {
  threatId: string;
  threatName: string;
  severityId: number;
  severityName: string;
  categoryId: number;
  categoryName: string;
  typeId: number;
  typeName: string;
  statusId: number;
  statusName: string;
  cleaningActionId: number;
  cleaningActionName: string;
  resources: string[];
}

export interface ThreatDetection {
  threatId: string;
  threatName: string;
  processName: string;
  detectionSourceTypeId: number;
  detectionSourceName: string;
  initialDetectionTime: string;
  lastThreatStatusChangeTime: string;
  remediationTime?: string;
  resources: string[];
  additionalActionsBitMask: number;
}

export interface ComputerStatus {
  antivirusEnabled: boolean;
  antivirusSignatureLastUpdated: string;
  antivirusSignatureVersion: string;
  antispywareEnabled: boolean;
  behaviorMonitorEnabled: boolean;
  ioavProtectionEnabled: boolean;
  nISEnabled: boolean;
  onAccessProtectionEnabled: boolean;
  realTimeProtectionEnabled: boolean;
  tamperProtectionSource: string;
  quickScanAge: number;
  fullScanAge: number;
  defenderServiceStatus: string;
  amRunningMode: string;
}

export interface SignatureUpdateResult {
  success: boolean;
  previousVersion?: string;
  currentVersion?: string;
  error?: string;
}

export interface ScanJob {
  jobId: string;
  psJobId: number;
  scanType: string;
  scanPath?: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'timeout';
  startTime: number;
  endTime?: number;
  result?: ScanResult;
}

export interface PowerShellResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export interface QueueOptions {
  maxConcurrent: number;
  timeoutMs: number;
}

export interface Config {
  maxConcurrentScans: number;
  scanTimeoutMs: number;
  allowedPaths: string[];
  cacheTtlMs: number;
  useMpCmdRun: boolean;
}
