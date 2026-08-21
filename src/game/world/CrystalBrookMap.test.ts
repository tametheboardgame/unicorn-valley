import { describe, expect, it } from 'vitest';
import { CRYSTAL_BROOK_MAP } from './CrystalBrookMap';
import {
  findUnreachableTargets,
  isPointBlocked,
  isPointInsideWalkableBounds,
} from './MapTraversal';

describe('Crystal Brook map', () => {
  it('keeps its spawn and important destinations inside clear walkable space', () => {
    const targets = [
      ...CRYSTAL_BROOK_MAP.entrances.map(({ id, approach }) => ({
        id: `entrance:${id}`,
        position: approach,
      })),
      ...CRYSTAL_BROOK_MAP.collectableSpots.map(({ id, position }) => ({
        id: `collectable:${id}`,
        position,
      })),
      ...CRYSTAL_BROOK_MAP.npcVisitPoints.map(({ id, position }) => ({
        id: `npc:${id}`,
        position,
      })),
      ...CRYSTAL_BROOK_MAP.secretRoutes.map(({ id, position }) => ({
        id: `secret:${id}`,
        position,
      })),
    ];

    expect(isPointInsideWalkableBounds(CRYSTAL_BROOK_MAP, CRYSTAL_BROOK_MAP.playerSpawn, 42)).toBe(
      true,
    );
    expect(isPointBlocked(CRYSTAL_BROOK_MAP.playerSpawn, CRYSTAL_BROOK_MAP.colliders, 42)).toBe(
      false,
    );
    expect(findUnreachableTargets(CRYSTAL_BROOK_MAP, targets, 40, 42)).toEqual([]);
  });

  it('provides several river treasures, stepping stones, a secret route and future NPC visit points', () => {
    expect(CRYSTAL_BROOK_MAP.collectableSpots.length).toBeGreaterThanOrEqual(4);
    expect(CRYSTAL_BROOK_MAP.steppingStones.length).toBeGreaterThanOrEqual(6);
    expect(CRYSTAL_BROOK_MAP.secretRoutes).toHaveLength(1);
    expect(CRYSTAL_BROOK_MAP.npcVisitPoints.length).toBeGreaterThanOrEqual(2);
    expect(
      new Set(CRYSTAL_BROOK_MAP.collectableSpots.map(({ itemId }) => itemId)).size,
    ).toBeGreaterThanOrEqual(2);
  });
});
