import { describe, expect, it } from 'vitest';
import {
  findUnreachableTargets,
  isPointBlocked,
  isPointInsideWalkableBounds,
} from './MapTraversal';
import { RAINBOW_MEADOW_LAYOUT, RAINBOW_MEADOW_MAP } from './RainbowMeadowMap';

const PLAYER_CLEARANCE = 42;

describe('Rainbow Meadow map', () => {
  it('keeps the village, Race Hub gateway, Crystal Brook and discoveries reachable', () => {
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
      ...RAINBOW_MEADOW_MAP.discoverySpots.map((spot) => ({
        id: `discovery:${spot.id}`,
        position: spot.position,
      })),
    ];

    expect(findUnreachableTargets(RAINBOW_MEADOW_MAP, targets)).toEqual([]);
  });

  it('keeps the deep-water collision clear only along the stepping-stone corridor', () => {
    const area = RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea;
    const corridorPoints = [
      ...area.steppingStones.map(({ x, y }) => ({ x, y })),
      ...area.steppingStones.slice(0, -1).map((stone, index) => {
        const next = area.steppingStones[index + 1];
        return { x: (stone.x + next.x) / 2, y: (stone.y + next.y) / 2 };
      }),
    ];

    for (const point of corridorPoints) {
      expect(isPointBlocked(point, RAINBOW_MEADOW_MAP.colliders, PLAYER_CLEARANCE)).toBe(false);
    }

    for (const blocker of area.deepWaterBlockers) {
      expect(isPointBlocked({ x: blocker.x, y: blocker.y }, RAINBOW_MEADOW_MAP.colliders)).toBe(
        true,
      );
    }
  });

  it('keeps interaction and discovery IDs unique', () => {
    const ids = [
      ...RAINBOW_MEADOW_MAP.entrances.map((entrance) => entrance.id),
      ...RAINBOW_MEADOW_MAP.hubFeatures.map((feature) => feature.id),
      ...RAINBOW_MEADOW_MAP.discoverySpots.map((spot) => spot.id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('provides at least two persistent Meadow secrets away from the Race Hub gateway', () => {
    expect(RAINBOW_MEADOW_MAP.discoverySpots.length).toBeGreaterThanOrEqual(2);
    const raceHubGateway = RAINBOW_MEADOW_MAP.hubFeatures.find(
      (feature) => feature.id === 'rainbow-run-entrance',
    );
    expect(raceHubGateway).toBeDefined();
    if (!raceHubGateway) {
      return;
    }
    for (const spot of RAINBOW_MEADOW_MAP.discoverySpots) {
      expect(spot.position.x).toBeLessThan(raceHubGateway.position.x - 300);
    }
  });
});
