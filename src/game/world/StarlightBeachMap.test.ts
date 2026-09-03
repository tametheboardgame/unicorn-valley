import { describe, expect, it } from 'vitest';
import {
  MOON_SPECKLE_SHELL_ITEM_ID,
  SUNRISE_SPIRAL_SHELL_ITEM_ID,
  WAVE_FAN_SHELL_ITEM_ID,
} from '../../content/r65StarlightBeach';
import {
  findUnreachableTargets,
  isPointBlocked,
  isPointInsideWalkableBounds,
} from './MapTraversal';
import { STARLIGHT_BEACH_MAP } from './StarlightBeachMap';

describe('Starlight Beach map', () => {
  it('keeps the spawn, entrance, landmarks and discovery spots safely reachable', () => {
    const targets = [
      ...STARLIGHT_BEACH_MAP.entrances.map(({ id, approach }) => ({
        id: `entrance:${id}`,
        position: approach,
      })),
      ...STARLIGHT_BEACH_MAP.landmarks.map(({ id, position }) => ({
        id: `landmark:${id}`,
        position,
      })),
      ...STARLIGHT_BEACH_MAP.discoverySpots.map(({ id, position }) => ({
        id: `discovery:${id}`,
        position,
      })),
    ];

    expect(
      isPointInsideWalkableBounds(STARLIGHT_BEACH_MAP, STARLIGHT_BEACH_MAP.playerSpawn, 42),
    ).toBe(true);
    expect(isPointBlocked(STARLIGHT_BEACH_MAP.playerSpawn, STARLIGHT_BEACH_MAP.colliders, 42)).toBe(
      false,
    );
    expect(findUnreachableTargets(STARLIGHT_BEACH_MAP, targets, 40, 42)).toEqual([]);
  });

  it('contains the four distinct Beach subareas required by WP9', () => {
    expect(STARLIGHT_BEACH_MAP.landmarks.map(({ id }) => id)).toEqual(
      expect.arrayContaining(['shell-cove', 'tide-pools', 'star-dunes', 'moonlit-point']),
    );
  });

  it('ships a finite three-shell Starlight Shell collection in the core region', () => {
    const itemIds = STARLIGHT_BEACH_MAP.discoverySpots.flatMap((spot) =>
      spot.itemId ? [spot.itemId] : [],
    );

    expect(itemIds).toEqual([
      SUNRISE_SPIRAL_SHELL_ITEM_ID,
      MOON_SPECKLE_SHELL_ITEM_ID,
      WAVE_FAN_SHELL_ITEM_ID,
    ]);
    expect(new Set(itemIds).size).toBe(3);
  });
});
