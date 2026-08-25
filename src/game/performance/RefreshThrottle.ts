export class RefreshThrottle {
  private nextRunAt = Number.NEGATIVE_INFINITY;

  public constructor(private readonly intervalMs: number) {
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
      throw new Error('Refresh interval must be a positive finite number.');
    }
  }

  public shouldRun(nowMs: number): boolean {
    if (!Number.isFinite(nowMs) || nowMs < this.nextRunAt) {
      return false;
    }

    this.nextRunAt = nowMs + this.intervalMs;
    return true;
  }

  public reset(): void {
    this.nextRunAt = Number.NEGATIVE_INFINITY;
  }
}
