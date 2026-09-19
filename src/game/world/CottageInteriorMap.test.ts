import { describe, expect, it } from 'vitest';
import {
  findUnreachableTargets,
  isPointBlocked,
  isPointInsideWalkableBounds,
} from './MapTraversal';
import { COTTAGE_INTERIOR_MAP, isCottagePointInsideReservedZone } from './CottageInteriorMap';
import {
  COTTAGE_DECORATION_PROTECTED_ANCHOR_IDS,
  resolveCottageSemanticAnchor,
} from './CottageSemanticAnchors';

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

  it('derives protected story capacity from semantic anchors', () => {
    expect(COTTAGE_INTERIOR_MAP.reservedZones).toHaveLength(
      COTTAGE_DECORATION_PROTECTED_ANCHOR_IDS.length,
    );

    for (const zone of COTTAGE_INTERIOR_MAP.reservedZones) {
      const anchor = resolveCottageSemanticAnchor(zone.anchorId);
      expect({ x: zone.x, y: zone.y }, zone.anchorId).toEqual(anchor.position);
      expect(zone.width, zone.anchorId).toBe(anchor.reservation?.width);
      expect(zone.height, zone.anchorId).toBe(anchor.reservation?.height);
    }
  });

  it('keeps ordinary decoration slots clear of protected story and portal capacity', () => {
    const slots = [
      ...COTTAGE_INTERIOR_MAP.decorationSlots,
      ...COTTAGE_INTERIOR_MAP.deferredDecorationSlots,
    ];

    for (const slot of slots) {
      expect(isCottagePointInsideReservedZone(slot.position, 46), slot.id).toBeNull();
    }
  });

  it('keeps future expansion capacity clear of permanent collision footprints', () => {
    for (const zone of COTTAGE_INTERIOR_MAP.reservedZones.filter(
      ({ purpose }) => purpose !== 'story',
    )) {
      for (const collider of COTTAGE_INTERIOR_MAP.colliders) {
        const overlapsX = Math.abs(zone.x - collider.x) < zone.width / 2 + collider.width / 2;
        const overlapsY = Math.abs(zone.y - collider.y) < zone.height / 2 + collider.height / 2;
        expect(overlapsX && overlapsY, `${zone.anchorId} overlaps ${collider.id}`).toBe(false);
      }
    }
  });

  it('uses unique stable decoration slot IDs', () => {
    const ids = COTTAGE_INTERIOR_MAP.decorationSlots.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.startsWith('cottage-slot:'))).toBe(true);
  });
});
