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
  it('keeps the spawn, exit, Wonderbook, treasure shelf and decoration interactions reachable', () => {
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
      { id: 'wonderbook-display', position: COTTAGE_INTERIOR_MAP.wonderbookDisplay.approach },
      { id: 'treasure-display', position: COTTAGE_INTERIOR_MAP.treasureDisplay.approach },
      ...COTTAGE_INTERIOR_MAP.decorationSlots.map((slot) => ({
        id: slot.id,
        position: slot.interactionPosition ?? slot.position,
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

  it('blocks the room edges while leaving the approved lower exit opening clear', () => {
    const colliderIds = COTTAGE_INTERIOR_MAP.colliders.map(({ id }) => id);
    expect(colliderIds).toEqual(
      expect.arrayContaining([
        'wall-top',
        'wall-left',
        'wall-right',
        'wall-bottom-left',
        'wall-bottom-right',
      ]),
    );

    const lowerBoundaryY = COTTAGE_INTERIOR_MAP.roomShell.bottom + 32;
    expect(
      isPointBlocked(
        { x: COTTAGE_INTERIOR_MAP.roomShell.left + 120, y: lowerBoundaryY },
        COTTAGE_INTERIOR_MAP.colliders,
        0,
      ),
    ).toBe(true);
    expect(
      isPointBlocked(
        { x: COTTAGE_INTERIOR_MAP.roomShell.right - 120, y: lowerBoundaryY },
        COTTAGE_INTERIOR_MAP.colliders,
        0,
      ),
    ).toBe(true);
    expect(
      isPointBlocked(
        { x: COTTAGE_INTERIOR_MAP.exit.position.x, y: lowerBoundaryY },
        COTTAGE_INTERIOR_MAP.colliders,
        0,
      ),
    ).toBe(false);
    expect(
      isPointBlocked(
        COTTAGE_INTERIOR_MAP.exit.approach,
        COTTAGE_INTERIOR_MAP.colliders,
        PLAYER_CLEARANCE,
      ),
    ).toBe(false);
  });

  it('aligns the back-wall blocker to the visible floor seam and keeps approaches below it', () => {
    const floorSeam = COTTAGE_INTERIOR_MAP.roomShell.backWallBottom;
    const wall = COTTAGE_INTERIOR_MAP.colliders.find(({ id }) => id === 'wall-top');
    expect(wall && wall.y + wall.height / 2).toBe(floorSeam);

    for (const id of [
      'cottage-slot:window-nook',
      'cottage-slot:left-wall',
      'cottage-slot:right-wall',
    ]) {
      const slot = COTTAGE_INTERIOR_MAP.decorationSlots.find((candidate) => candidate.id === id);
      expect(slot?.interactionPosition?.y).toBeGreaterThan(floorSeam + PLAYER_CLEARANCE);
    }
  });

  it('uses unique stable decoration slot IDs', () => {
    const ids = COTTAGE_INTERIOR_MAP.decorationSlots.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('cottage-slot:'))).toBe(true);
  });
});
