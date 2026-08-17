import { describe, expect, it } from 'vitest';
import {
  findUnreachableTargets,
  isPointBlocked,
  isPointInsideWalkableBounds,
} from './MapTraversal';
import { RAINBOW_MEADOW_MAP } from './RainbowMeadowMap';

const PLAYER_CLEARANCE = 42;

describe('Rainbow Meadow map', () => {
  it('keeps the village route, race hub, Nova and discoveries reachable', () => {
    expect(
      isPointInsideWalkableBounds(
        RAINBOW_MEADOW_MAP,
        RAINBOW_MEADOW_MAP.playerSpawn,
        PLAYER_CLEARANCE,
      ),
    ).toBe(true);
    expect(
      isPointBlocked(
        RAINBOW_MEADOW_MAP.playerSpawn,
        RAINBOW_MEADOW_MAP.colliders,
        PLAYER_CLEARANCE,
      ),
    ).toBe(false);

    const targets = [
      ...RAINBOW_MEADOW_MAP.entrances.map((entrance) => ({
        id: `entrance:${entrance.id}`,
        position: entrance.approach,
      })),
      ...RAINBOW_MEADOW_MAP.hubFeatures.map((feature) => ({
        id: `hub:${feature.id}`,
        position: feature.approach,
      })),
      ...RAINBOW_MEADOW_MAP.npcMarkers.map((marker) => ({
        id: `npc:${marker.id}`,
        position: marker.position,
      })),
      ...RAINBOW_MEADOW_MAP.discoverySpots.map((spot) => ({
        id: `discovery:${spot.id}`,
        position: spot.position,
      })),
    ];

    expect(findUnreachableTargets(RAINBOW_MEADOW_MAP, targets)).toEqual([]);
  });

  it('keeps interaction and discovery IDs unique', () => {
    const ids = [
      ...RAINBOW_MEADOW_MAP.entrances.map((entrance) => entrance.id),
      ...RAINBOW_MEADOW_MAP.hubFeatures.map((feature) => feature.id),
      ...RAINBOW_MEADOW_MAP.npcMarkers.map((marker) => marker.id),
      ...RAINBOW_MEADOW_MAP.discoverySpots.map((spot) => spot.id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('provides at least two persistent meadow secrets outside the race hub', () => {
    expect(RAINBOW_MEADOW_MAP.discoverySpots.length).toBeGreaterThanOrEqual(2);
    for (const spot of RAINBOW_MEADOW_MAP.discoverySpots) {
      expect(spot.position.x).toBeLessThan(
        RAINBOW_MEADOW_MAP.raceHub.x - RAINBOW_MEADOW_MAP.raceHub.width / 2,
      );
    }
  });
});
