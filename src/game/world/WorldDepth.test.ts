import { describe, expect, it } from 'vitest';
import { isWorldDepthSortable, WORLD_UI_DEPTH_FLOOR, worldDepthForY } from './WorldDepth';

describe('worldDepthForY', () => {
  it('places lower world positions in front of higher world positions', () => {
    expect(worldDepthForY(1200)).toBeGreaterThan(worldDepthForY(400));
  });

  it('supports small deterministic offsets for parts of the same prop', () => {
    expect(worldDepthForY(900, 0.5)).toBeGreaterThan(worldDepthForY(900));
  });

  it('keeps world rendering below the HUD depth range for current maps', () => {
    expect(worldDepthForY(3000, 5)).toBeLessThan(WORLD_UI_DEPTH_FLOOR);
  });

  it('clamps negative y values to the world base depth', () => {
    expect(worldDepthForY(-100)).toBe(worldDepthForY(0));
  });
});

describe('isWorldDepthSortable', () => {
  it('allows normal world objects to participate in occlusion sorting', () => {
    expect(isWorldDepthSortable(45)).toBe(true);
  });

  it('protects HUD and modal controls from world occlusion sorting', () => {
    expect(isWorldDepthSortable(WORLD_UI_DEPTH_FLOOR)).toBe(false);
    expect(isWorldDepthSortable(120)).toBe(false);
  });
});
