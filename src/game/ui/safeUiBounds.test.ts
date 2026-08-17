import { describe, expect, it } from 'vitest';
import { calculateContainedCanvasSize, getSafeUiBounds } from './safeUiBounds';

describe('responsive canvas helpers', () => {
  it('preserves the 16:9 logical canvas inside differently shaped containers', () => {
    const wide = calculateContainedCanvasSize(1920, 1080);
    const tall = calculateContainedCanvasSize(1024, 768);

    expect(wide.width / wide.height).toBeCloseTo(16 / 9);
    expect(tall.width / tall.height).toBeCloseTo(16 / 9);
    expect(tall).toEqual({ width: 1024, height: 576, scale: 0.8 });
  });

  it('keeps safe UI bounds inside the logical world', () => {
    expect(getSafeUiBounds(1280, 720, 48)).toEqual({
      x: 48,
      y: 48,
      width: 1184,
      height: 624,
    });
  });
});
