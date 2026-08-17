import { describe, expect, it } from 'vitest';
import {
  findUnreachableTargets,
  isPointBlocked,
  isPointInsideWalkableBounds,
} from './MapTraversal';
import { COTTAGE_INTERIOR_MAP } from './CottageInteriorMap';

const PLAYER_CLEARANCE = 42;
const EXIT_INTERACTION_RADIUS = 155;

describe('Moonflower Cottage interior map', () => {
  it('keeps the spawn, exit, treasure shelf and decoration slots reachable', () => {
    expect(
      isPointInsideWalkableBounds(
        COTTAGE_INTERIOR_MAP,
        COTTAGE_INTERIOR_MAP.playerSpawn,
        PLAYER_CLEARANCE,
      ),
    ).toBe(true);
    expect(
      isPointBlocked(
        COTTAGE_INTERIOR_MAP.playerSpawn,
        COTTAGE_INTERIOR_MAP.colliders,
        PLAYER_CLEARANCE,
      ),
    ).toBe(false);

    const targets = [
      { id: 'exit', position: COTTAGE_INTERIOR_MAP.exit.approach },
      { id: 'treasure-display', position: COTTAGE_INTERIOR_MAP.treasureDisplay.approach },
      ...COTTAGE_INTERIOR_MAP.decorationSlots.map((slot) => ({
        id: slot.id,
        position: slot.position,
      })),
    ];

    expect(findUnreachableTargets(COTTAGE_INTERIOR_MAP, targets)).toEqual([]);
  });

  it('spawns the player outside the cottage exit interaction radius', () => {
    const distanceFromExit = Math.hypot(
      COTTAGE_INTERIOR_MAP.playerSpawn.x - COTTAGE_INTERIOR_MAP.exit.approach.x,
      COTTAGE_INTERIOR_MAP.playerSpawn.y - COTTAGE_INTERIOR_MAP.exit.approach.y,
    );

    expect(distanceFromExit).toBeGreaterThan(EXIT_INTERACTION_RADIUS);
  });

  it('uses unique stable decoration slot IDs', () => {
    const ids = COTTAGE_INTERIOR_MAP.decorationSlots.map((slot) => slot.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('cottage-slot:'))).toBe(true);
  });
});
