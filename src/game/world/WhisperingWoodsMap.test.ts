import { describe, expect, it } from 'vitest';
import { findUnreachableTargets, isPointBlocked, isPointInsideWalkableBounds } from './MapTraversal';
import { WHISPERING_WOODS_MAP } from './WhisperingWoodsMap';

describe('Whispering Woods map', () => {
  it('keeps the spawn, landmarks and discoveries reachable through safe walkable space', () => {
    const targets = [
      ...WHISPERING_WOODS_MAP.entrances.map(({ id, approach }) => ({
        id: `entrance:${id}`,
        position: approach,
      })),
      ...WHISPERING_WOODS_MAP.landmarks.map(({ id, position }) => ({
        id: `landmark:${id}`,
        position,
      })),
      ...WHISPERING_WOODS_MAP.discoverySpots.map(({ id, position }) => ({
        id: `discovery:${id}`,
        position,
      })),
    ];

    expect(isPointInsideWalkableBounds(WHISPERING_WOODS_MAP, WHISPERING_WOODS_MAP.playerSpawn, 42)).toBe(
      true,
    );
    expect(isPointBlocked(WHISPERING_WOODS_MAP.playerSpawn, WHISPERING_WOODS_MAP.colliders, 42)).toBe(
      false,
    );
    expect(findUnreachableTargets(WHISPERING_WOODS_MAP, targets, 40, 42)).toEqual([]);
  });

  it('contains the visual identity and navigation anchors required for the region', () => {
    expect(WHISPERING_WOODS_MAP.landmarks.map(({ id }) => id)).toEqual(
      expect.arrayContaining(['mooncap-grove', 'glowfern-arch', 'lantern-clearing', 'mossy-whisper-path']),
    );
    expect(WHISPERING_WOODS_MAP.discoverySpots).toHaveLength(2);
  });
});
