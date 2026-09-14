import { describe, expect, it } from 'vitest';
import {
  AMBIENT_STREAM_FISH_NAME_PREFIX,
  MOONFLOWER_STREAM_FISH_BEHAVIOURS,
  MOONFLOWER_STREAM_FISHING_HOOK,
  MOONFLOWER_STREAM_REED_BEDS,
  MOONFLOWER_STREAM_SURFACE_MARKS,
  resolveAmbientFishLateralOffset,
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

  it('gives the ambient fish visibly different speeds and movement profiles', () => {
    const profiles = new Set(MOONFLOWER_STREAM_FISH_BEHAVIOURS.map((behaviour) => behaviour.profile));
    const durationScales = MOONFLOWER_STREAM_FISH_BEHAVIOURS.map(
      (behaviour) => behaviour.durationScale,
    );

    expect(profiles).toEqual(new Set(['straight', 'meander', 'weave', 'zigzag']));
    expect(Math.max(...durationScales) / Math.min(...durationScales)).toBeGreaterThan(1.5);
  });

  it('keeps meander and zigzag motion bounded while producing lateral travel', () => {
    for (const profile of ['meander', 'zigzag'] as const) {
      const behaviour = MOONFLOWER_STREAM_FISH_BEHAVIOURS.find(
        (candidate) => candidate.profile === profile,
      );
      expect(behaviour).toBeDefined();
      if (!behaviour) {
        continue;
      }

      const offsets = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1].map((progress) =>
        resolveAmbientFishLateralOffset(behaviour, progress),
      );
      expect(Math.max(...offsets) - Math.min(...offsets)).toBeGreaterThan(8);
      expect(Math.max(...offsets.map((offset) => Math.abs(offset)))).toBeLessThanOrEqual(
        behaviour.lateralAmplitude + 0.001,
      );
    }
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

  it('keeps every reed-bed footprint rooted on land instead of under the stream', () => {
    const { left, right } = MOONFLOWER_STREAM_FISHING_HOOK.bounds;

    for (const bed of MOONFLOWER_STREAM_REED_BEDS) {
      const bedLeft = bed.x - bed.width / 2;
      const bedRight = bed.x + bed.width / 2;
      expect(bedRight <= left || bedLeft >= right).toBe(true);
    }
  });

  it('exposes a stable future fishing hook without implementing fishing', () => {
    expect(MOONFLOWER_STREAM_FISHING_HOOK.id).toBe('stream:moonflower-glade');
    expect(MOONFLOWER_STREAM_FISHING_HOOK.fishNamePrefix).toBe(AMBIENT_STREAM_FISH_NAME_PREFIX);
    expect(MOONFLOWER_STREAM_FISHING_HOOK.bounds.bottom).toBeGreaterThan(
      MOONFLOWER_STREAM_FISHING_HOOK.bounds.top,
    );
  });
});
