export interface FramePerformanceSnapshot {
  sampleCount: number;
  averageFrameMs: number;
  p95FrameMs: number;
  worstFrameMs: number;
  longFrameCount: number;
}

export const LONG_FRAME_THRESHOLD_MS = 50;

export function summariseFrameDurations(
  durations: readonly number[],
  longFrameThresholdMs = LONG_FRAME_THRESHOLD_MS,
): FramePerformanceSnapshot {
  const samples = durations.filter((duration) => Number.isFinite(duration) && duration > 0);
  if (samples.length === 0) {
    return {
      sampleCount: 0,
      averageFrameMs: 0,
      p95FrameMs: 0,
      worstFrameMs: 0,
      longFrameCount: 0,
    };
  }

  const sorted = [...samples].sort((left, right) => left - right);
  const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  const total = samples.reduce((sum, duration) => sum + duration, 0);

  return {
    sampleCount: samples.length,
    averageFrameMs: total / samples.length,
    p95FrameMs: sorted[p95Index] ?? 0,
    worstFrameMs: sorted.at(-1) ?? 0,
    longFrameCount: samples.filter((duration) => duration > longFrameThresholdMs).length,
  };
}
