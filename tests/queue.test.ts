import { describe, it, expect } from 'vitest';
import { ScanQueue } from '../src/services/queue.js';

describe('ScanQueue', () => {
  it('tracks jobs', () => {
    const queue = new ScanQueue({ maxConcurrent: 2, timeoutMs: 5000 });
    queue.setJob({ jobId: 'test-1', psJobId: -1, scanType: 'QuickScan', status: 'queued', startTime: Date.now() });
    expect(queue.getJob('test-1')).toBeDefined();
    expect(queue.getJob('nonexistent')).toBeUndefined();
  });

  it('lists all jobs', () => {
    const queue = new ScanQueue({ maxConcurrent: 2, timeoutMs: 5000 });
    queue.setJob({ jobId: 'a', psJobId: -1, scanType: 'QuickScan', status: 'queued', startTime: Date.now() });
    queue.setJob({ jobId: 'b', psJobId: -1, scanType: 'CustomScan', status: 'running', startTime: Date.now() });
    expect(queue.getAllJobs()).toHaveLength(2);
  });

  it('respects concurrency limits', async () => {
    const queue = new ScanQueue({ maxConcurrent: 1, timeoutMs: 5000 });
    let running = 0;
    let maxRunning = 0;

    const makeTask = () => async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise(r => setTimeout(r, 50));
      running--;
    };

    await Promise.all([
      queue.enqueue('1', makeTask()),
      queue.enqueue('2', makeTask()),
      queue.enqueue('3', makeTask()),
    ]);

    // Wait for all to complete
    await new Promise(r => setTimeout(r, 200));
    expect(maxRunning).toBe(1);
  });

  it('reports stats', () => {
    const queue = new ScanQueue({ maxConcurrent: 4, timeoutMs: 5000 });
    const stats = queue.stats;
    expect(stats.running).toBe(0);
    expect(stats.queued).toBe(0);
  });

  it('cleans up old jobs', () => {
    const queue = new ScanQueue({ maxConcurrent: 2, timeoutMs: 5000 });
    queue.setJob({ jobId: 'old', psJobId: -1, scanType: 'QuickScan', status: 'completed', startTime: 1000, endTime: 2000 });
    queue.setJob({ jobId: 'new', psJobId: -1, scanType: 'QuickScan', status: 'completed', startTime: Date.now(), endTime: Date.now() });
    queue.cleanup(60000);
    expect(queue.getJob('old')).toBeUndefined();
    expect(queue.getJob('new')).toBeDefined();
  });
});
