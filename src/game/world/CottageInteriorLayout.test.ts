import { describe, expect, it } from 'vitest';
import {
  COTTAGE_FURNITURE_LAYOUT,
  COTTAGE_INTERIOR_MAP,
  COTTAGE_RESERVED_ZONES,
  COTTAGE_ROOM_SHELL,
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
    Math.abs(a.x - b.x) * 2 < a.width + b.width &&
    Math.abs(a.y - b.y) * 2 < a.height + b.height
  );
}

describe('H2.1 cottage room layout', () => {
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

  it('drives permanent-furniture colliders from the same authored layout', () => {
    const colliders = new Map(COTTAGE_INTERIOR_MAP.colliders.map((collider) => [collider.id, collider]));
    const expected = [
      ['fireplace', COTTAGE_FURNITURE_LAYOUT.fireplace],
      ['bed', COTTAGE_FURNITURE_LAYOUT.bed],
      ['tea-table', COTTAGE_FURNITURE_LAYOUT.teaTable],
      ['sofa', COTTAGE_FURNITURE_LAYOUT.sofa],
      ['treasure-shelf', COTTAGE_FURNITURE_LAYOUT.treasureShelf],
      ['wonderbook-lectern', COTTAGE_FURNITURE_LAYOUT.wonderbook],
    ] as const;

    for (const [id, layout] of expected) {
      expect(colliders.get(id)).toMatchObject(layout);
    }
  });

  it('keeps the entrance spawn and semantic approach points in usable floor space', () => {
    const furnitureColliders = COTTAGE_INTERIOR_MAP.colliders.filter(
      (collider) => !collider.id.startsWith('wall-'),
    );
    const usablePoints = [
      COTTAGE_INTERIOR_MAP.playerSpawn,
      COTTAGE_INTERIOR_MAP.exit.approach,
      COTTAGE_INTERIOR_MAP.wonderbookDisplay.approach,
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

  it('keeps protected story and portal zones clear of permanent furniture', () => {
    const permanentFurniture = Object.values(COTTAGE_FURNITURE_LAYOUT);

    for (const zone of COTTAGE_RESERVED_ZONES) {
      for (const furniture of permanentFurniture) {
        expect(overlaps(zone, furniture), `${zone.id} overlaps permanent furniture`).toBe(false);
      }
    }
  });
});
