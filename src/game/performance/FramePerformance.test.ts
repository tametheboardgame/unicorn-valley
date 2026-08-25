import { describe, expect, it } from 'vitest';
import { summariseFrameDurations } from './FramePerformance';

describe('summariseFrameDurations', () => {
  it('summarises average, percentile and long frames', () => {
    const summary = summariseFrameDurations([16, 17, 18, 20, 70]);

    expect(summary.sampleCount).toBe(5);
    expect(summary.averageFrameMs).toBeCloseTo(28.2);
    expect(summary.p95FrameMs).toBe(70);
    expect(summary.worstFrameMs).toBe(70);
    expect(summary.longFrameCount).toBe(1);
  });

  it('ignores invalid samples and supports an explicit long-frame threshold', () => {
    expect(summariseFrameDurations([Number.NaN, -1, 0])).toEqual({
      sampleCount: 0,
      averageFrameMs: 0,
      p95FrameMs: 0,
      worstFrameMs: 0,
      longFrameCount: 0,
    });

    expect(summariseFrameDurations([10, 20, 30], 15).longFrameCount).toBe(2);
  });
});
