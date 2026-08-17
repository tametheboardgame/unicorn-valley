import { describe, expect, it } from 'vitest';
import { FIRST_SPARKLE_POSITION, PIP_POSITION } from '../intro/PipIntro';
import { MOONFLOWER_GLADE_MAP } from './MoonflowerGladeMap';

const PLAYER_CLEARANCE = 46;

function pointIsInsideMap(point: { x: number; y: number }): boolean {
  return (
    point.x >= MOONFLOWER_GLADE_MAP.margin + PLAYER_CLEARANCE &&
    point.x <= MOONFLOWER_GLADE_MAP.width - MOONFLOWER_GLADE_MAP.margin - PLAYER_CLEARANCE &&
    point.y >= MOONFLOWER_GLADE_MAP.margin + PLAYER_CLEARANCE &&
    point.y <= MOONFLOWER_GLADE_MAP.height - MOONFLOWER_GLADE_MAP.margin - PLAYER_CLEARANCE
  );
}

function pointOverlapsCollider(point: { x: number; y: number }): boolean {
  return MOONFLOWER_GLADE_MAP.colliders.some((collider) => {
    const halfWidth = collider.width / 2 + PLAYER_CLEARANCE;
    const halfHeight = collider.height / 2 + PLAYER_CLEARANCE;
    return (
      Math.abs(point.x - collider.x) < halfWidth && Math.abs(point.y - collider.y) < halfHeight
    );
  });
}

describe('R1 first playable placement sweep', () => {
  it.each([
    ['Pip', PIP_POSITION],
    ['Moonflower Sparkle', FIRST_SPARKLE_POSITION],
  ] as const)('%s is inside playable bounds and clear of blocking collision', (_label, point) => {
    expect(pointIsInsideMap(point)).toBe(true);
    expect(pointOverlapsCollider(point)).toBe(false);
  });
});
