import { ScanJob, QueueOptions } from '../types/index.js';

type ScanTask = () => Promise<void>;

export class ScanQueue {
  private running = 0;
  private queue: ScanTask[] = [];
  private jobs = new Map<string, ScanJob>();
  private options: QueueOptions;

  constructor(options: QueueOptions) {
    this.options = options;
  }

  getJob(jobId: string): ScanJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(): ScanJob[] {
    return Array.from(this.jobs.values());
  }

  setJob(job: ScanJob): void {
    this.jobs.set(job.jobId, job);
  }

  async enqueue(jobId: string, task: ScanTask): Promise<void> {
    const wrappedTask = async () => {
      this.running++;
      try {
        await task();
      } finally {
        this.running--;
        this.dequeue();
      }
    };

    if (this.running < this.options.maxConcurrent) {
      wrappedTask();
    } else {
      this.queue.push(wrappedTask);
    }
  }

  private dequeue(): void {
    if (this.queue.length > 0 && this.running < this.options.maxConcurrent) {
      const next = this.queue.shift();
      if (next) next();
    }
  }

  cleanup(maxAgeMs: number): void {
    const now = Date.now();
    for (const [id, job] of this.jobs) {
      if (job.endTime && (now - job.endTime) > maxAgeMs) {
        this.jobs.delete(id);
      }
    }
  }

  get stats() {
    return {
      running: this.running,
      queued: this.queue.length,
      totalJobs: this.jobs.size,
    };
  }
}
