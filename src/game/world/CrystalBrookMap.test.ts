import { describe, expect, it } from 'vitest';
import {
  CRYSTAL_BROOK_ACTIVITY_POCKETS,
  CRYSTAL_BROOK_BOUNDARY_OPENINGS,
  CRYSTAL_BROOK_CENTRAL_BRIDGE,
  CRYSTAL_BROOK_DISTRICTS,
  CRYSTAL_BROOK_ICE_BRIDGES,
  CRYSTAL_BROOK_LAYOUT,
  CRYSTAL_BROOK_MAP,
  CRYSTAL_BROOK_MEADOW_WATER_EXIT,
  CRYSTAL_BROOK_PATH_PRESENTATION_SEGMENTS,
  CRYSTAL_BROOK_REFLECTION_FEEDER,
  CRYSTAL_BROOK_REFLECTION_POOL,
  CRYSTAL_BROOK_UPPER_POOL,
  CRYSTAL_BROOK_LOWER_POOL,
  CRYSTAL_BROOK_UPSTREAM_CASCADE,
  CRYSTAL_BROOK_WATERCOURSE,
  CRYSTAL_BROOK_WOODS_BRIDGE,
} from './CrystalBrookMap';
import {
  findUnreachableTargets,
  isPointBlocked,
  isPointInsideWalkableBounds,
} from './MapTraversal';

const PLAYER_CLEARANCE = 42;

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
      {
        id: 'threshold:whispering-woods',
        position: CRYSTAL_BROOK_LAYOUT.thresholds.whisperingWoods.approach,
      },
      {
        id: 'threshold:crystal-cup-hub',
        position: CRYSTAL_BROOK_LAYOUT.thresholds.crystalCupHub.approach,
      },
      {
        id: 'threshold:crystal-grotto-return',
        position: CRYSTAL_BROOK_LAYOUT.thresholds.crystalGrotto.returnPosition,
      },
      ...CRYSTAL_BROOK_ACTIVITY_POCKETS.map(({ id, approach }) => ({
        id: `activity:${id}`,
        position: approach,
      })),
    ];

    expect(
      isPointInsideWalkableBounds(
        CRYSTAL_BROOK_MAP,
        CRYSTAL_BROOK_MAP.playerSpawn,
        PLAYER_CLEARANCE,
      ),
    ).toBe(true);
    expect(
      isPointBlocked(CRYSTAL_BROOK_MAP.playerSpawn, CRYSTAL_BROOK_MAP.colliders, PLAYER_CLEARANCE),
    ).toBe(false);
    expect(findUnreachableTargets(CRYSTAL_BROOK_MAP, targets, 40, PLAYER_CLEARANCE)).toEqual([]);
  });

  it('provides river treasures, a retained stepping-stone crossing, a secret route and NPC visit points', () => {
    expect(CRYSTAL_BROOK_MAP.collectableSpots.length).toBeGreaterThanOrEqual(4);
    expect(CRYSTAL_BROOK_MAP.steppingStones.length).toBeGreaterThanOrEqual(3);
    expect(CRYSTAL_BROOK_MAP.secretRoutes).toHaveLength(1);
    expect(CRYSTAL_BROOK_MAP.npcVisitPoints.length).toBeGreaterThanOrEqual(2);
    expect(
      new Set(CRYSTAL_BROOK_MAP.collectableSpots.map(({ itemId }) => itemId)).size,
    ).toBeGreaterThanOrEqual(2);
  });

  it('defines one continuous Brook from the upstream cascade through both basins to Rainbow Meadow', () => {
    expect(CRYSTAL_BROOK_WATERCOURSE[0].x).toBeGreaterThan(3300);
    expect(CRYSTAL_BROOK_WATERCOURSE.at(-1)?.x).toBeLessThan(0);

    for (const target of [
      CRYSTAL_BROOK_UPSTREAM_CASCADE,
      CRYSTAL_BROOK_UPPER_POOL,
      CRYSTAL_BROOK_LOWER_POOL,
      CRYSTAL_BROOK_MEADOW_WATER_EXIT,
    ]) {
      expect(CRYSTAL_BROOK_WATERCOURSE.some(({ x, y }) => x === target.x && y === target.y)).toBe(
        true,
      );
    }

    expect(CRYSTAL_BROOK_MEADOW_WATER_EXIT.x).toBe(
      CRYSTAL_BROOK_LAYOUT.thresholds.rainbowMeadow.position.x,
    );
    expect(CRYSTAL_BROOK_MEADOW_WATER_EXIT.y).toBeLessThan(
      CRYSTAL_BROOK_LAYOUT.thresholds.rainbowMeadow.position.y - 100,
    );

    for (const point of CRYSTAL_BROOK_WATERCOURSE) {
      expect(point.outerWidth).toBeGreaterThan(point.innerWidth);
      expect(point.innerWidth).toBeGreaterThan(point.deepWidth);
      expect(point.deepWidth).toBeGreaterThan(0);
    }

    expect(CRYSTAL_BROOK_REFLECTION_FEEDER.points[0]).toEqual({ x: 2550, y: 1290 });
    expect(CRYSTAL_BROOK_REFLECTION_FEEDER.points.at(-1)).toEqual(CRYSTAL_BROOK_REFLECTION_POOL);
    expect(CRYSTAL_BROOK_REFLECTION_FEEDER.outerWidth).toBeLessThan(70);
  });

  it('keeps the west path on the cave approach while the Brook exits above it', () => {
    const westSegment = CRYSTAL_BROOK_PATH_PRESENTATION_SEGMENTS[0];
    expect(westSegment[0]).toEqual(CRYSTAL_BROOK_LAYOUT.thresholds.rainbowMeadow.position);
    expect(westSegment[1]).toEqual(CRYSTAL_BROOK_LAYOUT.thresholds.rainbowMeadow.approach);
    expect(CRYSTAL_BROOK_MEADOW_WATER_EXIT.y).toBeLessThan(westSegment[0].y);
    expect(CRYSTAL_BROOK_WATERCOURSE.at(-2)?.outerWidth).toBeLessThanOrEqual(150);
  });

  it('uses two deliberate glacial bridge gaps instead of painting path under the Brook', () => {
    expect(CRYSTAL_BROOK_ICE_BRIDGES).toHaveLength(2);
    expect(CRYSTAL_BROOK_PATH_PRESENTATION_SEGMENTS).toHaveLength(3);

    expect(CRYSTAL_BROOK_PATH_PRESENTATION_SEGMENTS[0].at(-1)).toEqual(
      CRYSTAL_BROOK_CENTRAL_BRIDGE.westLanding,
    );
    expect(CRYSTAL_BROOK_PATH_PRESENTATION_SEGMENTS[1][0]).toEqual(
      CRYSTAL_BROOK_CENTRAL_BRIDGE.eastLanding,
    );
    expect(CRYSTAL_BROOK_PATH_PRESENTATION_SEGMENTS[1].at(-1)).toEqual(
      CRYSTAL_BROOK_WOODS_BRIDGE.westLanding,
    );
    expect(CRYSTAL_BROOK_PATH_PRESENTATION_SEGMENTS[2][0]).toEqual(
      CRYSTAL_BROOK_WOODS_BRIDGE.eastLanding,
    );

    for (const bridge of CRYSTAL_BROOK_ICE_BRIDGES) {
      expect(bridge.eastLanding.x).toBeGreaterThan(bridge.westLanding.x);
      expect(bridge.length).toBeGreaterThan(300);
      expect(bridge.deckWidth).toBeLessThan(110);
    }
  });

  it('moves Crystal Cup to the top edge and Whispering Woods lower on the east edge', () => {
    expect(CRYSTAL_BROOK_LAYOUT.thresholds.crystalCupHub.position.y).toBeLessThanOrEqual(140);
    expect(CRYSTAL_BROOK_LAYOUT.thresholds.crystalCupHub.approach.y).toBeGreaterThan(
      CRYSTAL_BROOK_LAYOUT.thresholds.crystalCupHub.position.y,
    );
    expect(CRYSTAL_BROOK_LAYOUT.thresholds.whisperingWoods.position.y).toBeGreaterThan(1400);
  });

  it('keeps canonical route endpoints aligned with their structural destinations', () => {
    expect(CRYSTAL_BROOK_LAYOUT.routes.main.at(0)).toEqual({ x: 100, y: 1090 });
    expect(CRYSTAL_BROOK_LAYOUT.routes.main.at(-1)).toEqual(
      CRYSTAL_BROOK_LAYOUT.thresholds.whisperingWoods.position,
    );

    expect(CRYSTAL_BROOK_LAYOUT.routes.whisperingWoods.at(-1)).toEqual(
      CRYSTAL_BROOK_LAYOUT.thresholds.whisperingWoods.position,
    );
    expect(CRYSTAL_BROOK_LAYOUT.routes.crystalCupHub.at(-1)).toEqual(
      CRYSTAL_BROOK_LAYOUT.thresholds.crystalCupHub.position,
    );
    expect(CRYSTAL_BROOK_LAYOUT.routes.crystalGrotto.at(-1)).toEqual(
      CRYSTAL_BROOK_LAYOUT.thresholds.crystalGrotto.position,
    );
  });

  it('reserves distinct reachable pockets for the two planned Brook activities', () => {
    const [crystalarium, checkers] = CRYSTAL_BROOK_ACTIVITY_POCKETS;
    expect(crystalarium.id).toBe('crystalarium');
    expect(checkers.id).toBe('crystal-checkers');

    const centreDistance = Math.hypot(
      crystalarium.centre.x - checkers.centre.x,
      crystalarium.centre.y - checkers.centre.y,
    );
    expect(centreDistance).toBeGreaterThan(crystalarium.radiusX + checkers.radiusX);

    for (const pocket of CRYSTAL_BROOK_ACTIVITY_POCKETS) {
      expect(
        isPointInsideWalkableBounds(CRYSTAL_BROOK_MAP, pocket.approach, PLAYER_CLEARANCE),
      ).toBe(true);
      expect(isPointBlocked(pocket.approach, CRYSTAL_BROOK_MAP.colliders, PLAYER_CLEARANCE)).toBe(
        false,
      );
    }
  });

  it('keeps boundary openings aligned with the canonical route thresholds', () => {
    const [meadow, woods, crystalCup] = CRYSTAL_BROOK_BOUNDARY_OPENINGS;

    expect(meadow.position).toEqual(CRYSTAL_BROOK_LAYOUT.thresholds.rainbowMeadow.position);
    expect(meadow.approach).toEqual(CRYSTAL_BROOK_LAYOUT.thresholds.rainbowMeadow.approach);
    expect(woods.position).toEqual(CRYSTAL_BROOK_LAYOUT.thresholds.whisperingWoods.position);
    expect(woods.approach).toEqual(CRYSTAL_BROOK_LAYOUT.thresholds.whisperingWoods.approach);
    expect(crystalCup.position).toEqual(CRYSTAL_BROOK_LAYOUT.thresholds.crystalCupHub.position);
    expect(crystalCup.approach).toEqual(CRYSTAL_BROOK_LAYOUT.thresholds.crystalCupHub.approach);
  });

  it('keeps canonical named layout entries unique', () => {
    const names = [
      ...CRYSTAL_BROOK_DISTRICTS.map(({ id }) => `district:${id}`),
      ...Object.keys(CRYSTAL_BROOK_LAYOUT.thresholds).map((id) => `threshold:${id}`),
      ...Object.keys(CRYSTAL_BROOK_LAYOUT.routes).map((id) => `route:${id}`),
      ...CRYSTAL_BROOK_BOUNDARY_OPENINGS.map(({ id }) => `boundary:${id}`),
      ...CRYSTAL_BROOK_ACTIVITY_POCKETS.map(({ id }) => `activity:${id}`),
    ];

    expect(new Set(names).size).toBe(names.length);
  });
});
