export const SeverityMap: Record<number, string> = {
  0: 'Unknown',
  1: 'Low',
  2: 'Moderate',
  3: 'High',
  4: 'Severe',
};

export const ThreatStatusMap: Record<number, string> = {
  0: 'Unknown',
  1: 'Detected',
  2: 'Cleaned',
  3: 'Quarantined',
  4: 'Removed',
  5: 'Allowed',
  6: 'Blocked',
};

export const CleaningActionMap: Record<number, string> = {
  1: 'Clean',
  2: 'Quarantine',
  3: 'Remove',
  6: 'Allow',
  10: 'Block',
};

export const TypeMap: Record<number, string> = {
  0: 'Known Bad',
  1: 'Behavior',
  2: 'Unknown',
  3: 'Known Good',
  4: 'NRI',
};

export const DetectionSourceMap: Record<number, string> = {
  0: 'Unknown',
  1: 'User',
  2: 'System',
  3: 'Realtime',
  4: 'IOAV',
  5: 'NRI',
  7: 'ELAM',
};

export const CategoryMap: Record<number, string> = {
  0: 'INVALID',
  1: 'ADWARE',
  2: 'SPYWARE',
  3: 'PASSWORDSTEALER',
  4: 'TROJANDOWNLOADER',
  5: 'WORM',
  6: 'BACKDOOR',
  7: 'REMOTEACCESSTROJAN',
  8: 'TROJAN',
  9: 'EMAILFLOODER',
  10: 'KEYLOGGER',
  11: 'DIALER',
  12: 'MONITORINGSOFTWARE',
  13: 'BROWSERMODIFIER',
  14: 'COOKIE',
  15: 'BROWSERPLUGIN',
  16: 'AOLEXPLOIT',
  17: 'NUKER',
  18: 'SECURITYDISABLER',
  19: 'JOKEPROGRAM',
  20: 'HOSTILEACTIVEXCONTROL',
  21: 'SOFTWAREBUNDLER',
  22: 'STEALTHNOTIFIER',
  23: 'SETTINGSMODIFIER',
  24: 'TOOLBAR',
  25: 'REMOTECONTROLSOFTWARE',
  26: 'TROJANFTP',
  27: 'POTENTIALUNWANTEDSOFTWARE',
  28: 'ICQEXPLOIT',
  29: 'TROJANTELNET',
  30: 'EXPLOIT',
  31: 'FILESHARINGPROGRAM',
  32: 'MALWARE_CREATION_TOOL',
  33: 'REMOTE_CONTROL_SOFTWARE',
  34: 'TOOL',
  36: 'TROJAN_DENIALOFSERVICE',
  37: 'TROJAN_DROPPER',
  38: 'TROJAN_MASSMAILER',
  39: 'TROJAN_MONITORINGSOFTWARE',
  40: 'TROJAN_PROXYSERVER',
  42: 'VIRUS',
  43: 'KNOWN',
  44: 'UNKNOWN',
  45: 'SPP',
  46: 'BEHAVIOR',
  47: 'VULNERABILITY',
  48: 'POLICY',
  49: 'ENTERPRISEUNWANTEDSOFTWARE',
  50: 'RANSOMWARE',
  51: 'ASR_RULE',
};

export function getSeverityName(id: number): string {
  return SeverityMap[id] ?? 'Unknown';
}

export function getThreatStatusName(id: number): string {
  return ThreatStatusMap[id] ?? 'Unknown';
}

export function getCleaningActionName(id: number): string {
  return CleaningActionMap[id] ?? 'Unknown';
}

export function getTypeName(id: number): string {
  return TypeMap[id] ?? 'Unknown';
}

export function getDetectionSourceName(id: number): string {
  return DetectionSourceMap[id] ?? 'Unknown';
}

export function getCategoryName(id: number): string {
  return CategoryMap[id] ?? 'Unknown';
}
