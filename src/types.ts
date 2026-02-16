export interface ScanFileResult {
  file_path: string;
  scanned: boolean;
  threats_found?: number;
  threats?: ThreatInfo[];
  error?: string;
}

export interface ThreatInfo {
  name: string;
  severity: string;
  status: string;
  detected_at: string;
}

export interface QuickScanResult {
  scan_type: string;
  completed: boolean;
  message: string;
  error?: string;
}

export interface DefenderStatus {
  antivirus_enabled: boolean;
  realtime_protection: boolean;
  antispyware_enabled: boolean;
  service_running: boolean;
  signature_version: string;
  signature_last_updated: string;
  last_quick_scan: string;
  last_full_scan: string;
  computer_state: string;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
