import { describe, it, expect } from 'vitest';
import { getSeverityName, getThreatStatusName, getCleaningActionName, getTypeName, getDetectionSourceName, getCategoryName } from '../src/utils/enums.js';

describe('enum mappings', () => {
  it('maps severity IDs', () => {
    expect(getSeverityName(0)).toBe('Unknown');
    expect(getSeverityName(1)).toBe('Low');
    expect(getSeverityName(4)).toBe('Severe');
    expect(getSeverityName(99)).toBe('Unknown');
  });

  it('maps threat status IDs', () => {
    expect(getThreatStatusName(1)).toBe('Detected');
    expect(getThreatStatusName(3)).toBe('Quarantined');
    expect(getThreatStatusName(6)).toBe('Blocked');
  });

  it('maps cleaning action IDs', () => {
    expect(getCleaningActionName(2)).toBe('Quarantine');
    expect(getCleaningActionName(10)).toBe('Block');
  });

  it('maps type IDs', () => {
    expect(getTypeName(0)).toBe('Known Bad');
    expect(getTypeName(3)).toBe('Known Good');
  });

  it('maps detection source IDs', () => {
    expect(getDetectionSourceName(3)).toBe('Realtime');
    expect(getDetectionSourceName(7)).toBe('ELAM');
  });

  it('maps category IDs', () => {
    expect(getCategoryName(50)).toBe('RANSOMWARE');
    expect(getCategoryName(8)).toBe('TROJAN');
    expect(getCategoryName(999)).toBe('Unknown');
  });
});
