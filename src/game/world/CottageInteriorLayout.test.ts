import { describe, expect, it } from 'vitest';
import {
  COTTAGE_FURNITURE_COLLIDERS,
  COTTAGE_FURNITURE_DEPTH_ANCHORS,
  COTTAGE_FURNITURE_LAYOUT,
  COTTAGE_INTERIOR_MAP,
  COTTAGE_RESERVED_ZONES,
  COTTAGE_ROOM_SHELL,
  COTTAGE_SLEEP_LAYOUT,
  type CottageRectLayout,
} from './CottageInteriorMap';
import { COTTAGE_SEMANTIC_ANCHORS } from './CottageSemanticAnchors';

function containsPoint(rect: CottageRectLayout, point: { x: number; y: number }): boolean {
  return (
    point.x >= rect.x - rect.width / 2 &&
    point.x <= rect.x + rect.width / 2 &&
    point.y >= rect.y - rect.height / 2 &&
    point.y <= rect.y + rect.height / 2
  );
}

function overlaps(a: CottageRectLayout, b: CottageRectLayout): boolean {
  return (
    Math.abs(a.x - b.x) * 2 < a.width + b.width && Math.abs(a.y - b.y) * 2 < a.height + b.height
  );
}

describe('H2 cottage room layout and physicality', () => {
  it('uses a compact home-scale shell with a substantial walkable floor', () => {
    const width = COTTAGE_ROOM_SHELL.right - COTTAGE_ROOM_SHELL.left;
    const height = COTTAGE_ROOM_SHELL.bottom - COTTAGE_ROOM_SHELL.top;
    const floorDepth = COTTAGE_ROOM_SHELL.bottom - COTTAGE_ROOM_SHELL.backWallBottom;

    expect(width / height).toBeGreaterThan(1.3);
    expect(width / height).toBeLessThan(1.55);
    expect(floorDepth / height).toBeGreaterThan(0.6);
    expect(COTTAGE_INTERIOR_MAP.width).toBeLessThan(1800);
    expect(COTTAGE_INTERIOR_MAP.height).toBeLessThan(1200);
  });

  it('uses floor footprints instead of the old full visual rectangles', () => {
    const colliders = new Map(
      COTTAGE_FURNITURE_COLLIDERS.map((collider) => [collider.id, collider]),
    );

    expect(colliders.has('fireplace-front')).toBe(true);
    expect(colliders.has('bed-headboard')).toBe(true);
    expect(colliders.has('bed-left-rail')).toBe(true);
    expect(colliders.has('bed-right-rail')).toBe(true);
    expect(colliders.has('tea-chair-left')).toBe(true);
    expect(colliders.has('tea-chair-right')).toBe(true);
    expect(colliders.has('sofa-base')).toBe(true);
    expect(colliders.has('treasure-shelf-front')).toBe(true);
    expect(colliders.has('wonderbook-lectern')).toBe(true);

    const table = colliders.get('tea-table');
    const sofa = colliders.get('sofa-base');
    expect((table?.width ?? Infinity) * (table?.height ?? Infinity)).toBeLessThan(
      COTTAGE_FURNITURE_LAYOUT.teaTable.width * COTTAGE_FURNITURE_LAYOUT.teaTable.height,
    );
    expect((sofa?.width ?? Infinity) * (sofa?.height ?? Infinity)).toBeLessThan(
      COTTAGE_FURNITURE_LAYOUT.sofa.width * COTTAGE_FURNITURE_LAYOUT.sofa.height,
    );
  });

  it('leaves a clear foot-entry lane to the semantic sleep trigger', () => {
    const bedColliders = COTTAGE_FURNITURE_COLLIDERS.filter(({ id }) => id.startsWith('bed-'));

    expect(bedColliders).toHaveLength(3);
    expect(
      bedColliders.some((collider) => containsPoint(collider, COTTAGE_SLEEP_LAYOUT.trigger)),
    ).toBe(false);
    expect(
      bedColliders.some((collider) =>
        containsPoint(collider, {
          x: COTTAGE_SLEEP_LAYOUT.trigger.x,
          y: COTTAGE_FURNITURE_LAYOUT.bed.y + 110,
        }),
      ),
    ).toBe(false);
  });

  it('protects the visible unicorn from clipping through the bed side rails', () => {
    const leftRail = COTTAGE_FURNITURE_COLLIDERS.find(({ id }) => id === 'bed-left-rail');
    const rightRail = COTTAGE_FURNITURE_COLLIDERS.find(({ id }) => id === 'bed-right-rail');

    expect(leftRail?.width).toBeGreaterThanOrEqual(50);
    expect(rightRail?.width).toBeGreaterThanOrEqual(50);
    expect((rightRail?.x ?? 0) - (leftRail?.x ?? 0)).toBeGreaterThan(200);
  });

  it('keeps the open exit physically open while protecting its frame', () => {
    const bottomColliders = COTTAGE_INTERIOR_MAP.colliders.filter(
      ({ id }) => id.startsWith('wall-bottom') || id.startsWith('exit-'),
    );

    expect(bottomColliders.some((collider) => containsPoint(collider, { x: 750, y: 1032 }))).toBe(
      false,
    );
    expect(COTTAGE_FURNITURE_COLLIDERS.some(({ id }) => id === 'exit-left-post')).toBe(true);
    expect(COTTAGE_FURNITURE_COLLIDERS.some(({ id }) => id === 'exit-right-post')).toBe(true);
  });

  it('stops the player before the visible bottom wall rather than on top of it', () => {
    const bottomWallSegments = COTTAGE_INTERIOR_MAP.colliders.filter(({ id }) =>
      id.startsWith('wall-bottom'),
    );

    expect(bottomWallSegments).toHaveLength(2);
    for (const collider of bottomWallSegments) {
      const topEdge = collider.y - collider.height / 2;
      expect(topEdge).toBeLessThanOrEqual(COTTAGE_ROOM_SHELL.bottom - 20);
    }
  });

  it('keeps entrance, interaction approaches, sleep trigger and visitors out of blockers', () => {
    const furnitureColliders = COTTAGE_INTERIOR_MAP.colliders.filter(
      (collider) => !collider.id.startsWith('wall-') && !collider.id.startsWith('exit-'),
    );
    const usablePoints = [
      COTTAGE_INTERIOR_MAP.playerSpawn,
      COTTAGE_INTERIOR_MAP.exit.approach,
      COTTAGE_INTERIOR_MAP.wonderbookDisplay.approach,
      COTTAGE_INTERIOR_MAP.treasureDisplay.approach,
      COTTAGE_SLEEP_LAYOUT.trigger,
      COTTAGE_SLEEP_LAYOUT.wake,
      ...Object.values(COTTAGE_SEMANTIC_ANCHORS)
        .filter((anchor) => anchor.purpose === 'visitor')
        .map((anchor) => anchor.position),
    ];

    for (const point of usablePoints) {
      expect(point.x).toBeGreaterThan(COTTAGE_ROOM_SHELL.left);
      expect(point.x).toBeLessThan(COTTAGE_ROOM_SHELL.right);
      expect(point.y).toBeGreaterThanOrEqual(COTTAGE_ROOM_SHELL.backWallBottom);
      expect(point.y).toBeLessThan(COTTAGE_ROOM_SHELL.bottom);
      expect(furnitureColliders.some((collider) => containsPoint(collider, point))).toBe(false);
    }
  });

  it('defines deliberate front/back sort lines from back wall to foreground', () => {
    expect(COTTAGE_FURNITURE_DEPTH_ANCHORS.fireplace).toBeLessThan(
      COTTAGE_FURNITURE_DEPTH_ANCHORS['tea-table'],
    );
    expect(COTTAGE_FURNITURE_DEPTH_ANCHORS['treasure-shelf']).toBeLessThan(
      COTTAGE_FURNITURE_DEPTH_ANCHORS.sofa,
    );
    expect(COTTAGE_FURNITURE_DEPTH_ANCHORS['tea-table']).toBeLessThan(
      COTTAGE_FURNITURE_DEPTH_ANCHORS.bed,
    );
    expect(COTTAGE_FURNITURE_DEPTH_ANCHORS.sofa).toBeLessThan(
      COTTAGE_FURNITURE_DEPTH_ANCHORS.wonderbook,
    );
    expect(COTTAGE_FURNITURE_DEPTH_ANCHORS.wonderbook).toBeLessThan(
      COTTAGE_FURNITURE_DEPTH_ANCHORS.exit,
    );
  });

  it('keeps protected story and portal zones clear of permanent furniture', () => {
    const permanentFurniture = Object.values(COTTAGE_FURNITURE_LAYOUT);

    for (const zone of COTTAGE_RESERVED_ZONES) {
      for (const furniture of permanentFurniture) {
        expect(overlaps(zone, furniture), `${zone.id} overlaps permanent furniture`).toBe(false);
      }
    }
  });
});
