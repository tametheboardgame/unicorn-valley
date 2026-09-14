import { describe, expect, it } from 'vitest';
import {
  AMBIENT_STREAM_FISH_NAME_PREFIX,
  MOONFLOWER_STREAM_FISHING_HOOK,
  MOONFLOWER_STREAM_SURFACE_MARKS,
  resolveAmbientFishRun,
} from './MoonflowerStreamLifeModel';

describe('MoonflowerStreamLife', () => {
  it('keeps ambient fish runs inside the stream and varies travel timing', () => {
    const slowLeft = resolveAmbientFishRun(0, 1, 0.9);
    const fastRight = resolveAmbientFishRun(1, 0, 0.1);

    expect(slowLeft.x).toBeGreaterThanOrEqual(MOONFLOWER_STREAM_FISHING_HOOK.bounds.left);
    expect(fastRight.x).toBeLessThanOrEqual(MOONFLOWER_STREAM_FISHING_HOOK.bounds.right);
    expect(slowLeft.durationMs).toBeGreaterThan(fastRight.durationMs);
    expect(slowLeft.shouldSurface).toBe(false);
    expect(fastRight.shouldSurface).toBe(true);
  });

  it('uses irregular surface marks instead of a fixed repeated interval', () => {
    const gaps = MOONFLOWER_STREAM_SURFACE_MARKS.slice(1).map(
      (mark, index) => mark.y - MOONFLOWER_STREAM_SURFACE_MARKS[index].y,
    );

    expect(new Set(gaps).size).toBeGreaterThan(3);
    expect(new Set(MOONFLOWER_STREAM_SURFACE_MARKS.map((mark) => mark.width)).size).toBeGreaterThan(
      4,
    );
  });

  it('exposes a stable future fishing hook without implementing fishing', () => {
    expect(MOONFLOWER_STREAM_FISHING_HOOK.id).toBe('stream:moonflower-glade');
    expect(MOONFLOWER_STREAM_FISHING_HOOK.fishNamePrefix).toBe(AMBIENT_STREAM_FISH_NAME_PREFIX);
    expect(MOONFLOWER_STREAM_FISHING_HOOK.bounds.bottom).toBeGreaterThan(
      MOONFLOWER_STREAM_FISHING_HOOK.bounds.top,
    );
  });
});
