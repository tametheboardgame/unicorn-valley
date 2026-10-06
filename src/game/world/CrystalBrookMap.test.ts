import { describe, expect, it } from 'vitest';
import {
  CRYSTAL_BROOK_ACTIVITY_POCKETS,
  CRYSTAL_BROOK_BOUNDARY_OPENINGS,
  CRYSTAL_BROOK_CRYSTAL_CUP_JUNCTION,
  CRYSTAL_BROOK_DISTRICTS,
  CRYSTAL_BROOK_EAST_BRIDGE,
  CRYSTAL_BROOK_ICE_BRIDGES,
  CRYSTAL_BROOK_LAYOUT,
  CRYSTAL_BROOK_LOCAL_TRAILS,
  CRYSTAL_BROOK_MAP,
  CRYSTAL_BROOK_MEADOW_GORGE,
  CRYSTAL_BROOK_MEADOW_WATER_EXIT,
  CRYSTAL_BROOK_NORTH_BRIDGE,
  CRYSTAL_BROOK_REFLECTION_FEEDER,
  CRYSTAL_BROOK_REFLECTION_POOL,
  CRYSTAL_BROOK_UPPER_POOL,
  CRYSTAL_BROOK_LOWER_POOL,
  CRYSTAL_BROOK_UPSTREAM_CASCADE,
  CRYSTAL_BROOK_WATERCOURSE,
} from './CrystalBrookMap';
import {
  findUnreachableTargets,
  isPointBlocked,
  isPointInsideWalkableBounds,
} from './MapTraversal';
import { RAINBOW_MEADOW_LAYOUT } from './RainbowMeadowMap';
import { WALK_THROUGH_GATEWAY_RADIUS } from './RegionGatewayRules';

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

  it('provides river treasures, a secret route and NPC visit points', () => {
    expect(CRYSTAL_BROOK_MAP.collectableSpots.length).toBeGreaterThanOrEqual(4);
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

  it('uses one continuous west-bank trail through the gorge and into Crystal Brook', () => {
    const westTrail = CRYSTAL_BROOK_LOCAL_TRAILS.find(({ id }) => id === 'meadow-south-bank');
    expect(westTrail).toBeDefined();
    if (!westTrail) throw new Error('Missing Meadow south-bank trail');

    expect(westTrail.points[0].x).toBeLessThan(0);
    expect(westTrail.points[1]).toEqual(CRYSTAL_BROOK_LAYOUT.thresholds.rainbowMeadow.position);
    expect(westTrail.points[2]).toEqual(CRYSTAL_BROOK_LAYOUT.thresholds.rainbowMeadow.approach);
    expect(CRYSTAL_BROOK_MEADOW_WATER_EXIT.y).toBeLessThan(
      CRYSTAL_BROOK_MEADOW_GORGE.pathOpening.y,
    );
    expect(CRYSTAL_BROOK_WATERCOURSE.at(-2)?.outerWidth).toBeLessThanOrEqual(150);
  });

  it('keeps the Meadow path and Brook openings distinct inside one west gorge', () => {
    expect(CRYSTAL_BROOK_MEADOW_GORGE.pathOpening).toEqual(
      CRYSTAL_BROOK_LAYOUT.thresholds.rainbowMeadow.position,
    );
    expect(CRYSTAL_BROOK_MEADOW_GORGE.waterOpening).toEqual(CRYSTAL_BROOK_MEADOW_WATER_EXIT);

    const verticalSeparation =
      CRYSTAL_BROOK_MEADOW_GORGE.pathOpening.y - CRYSTAL_BROOK_MEADOW_GORGE.waterOpening.y;
    expect(verticalSeparation).toBeGreaterThan(140);
    expect(verticalSeparation).toBeLessThan(220);
  });

  it('keeps the water throat above the path and frames the entrance with an overhang', () => {
    expect(CRYSTAL_BROOK_MEADOW_GORGE.waterThroat.centre).toEqual(
      CRYSTAL_BROOK_MEADOW_GORGE.waterOpening,
    );
    expect(CRYSTAL_BROOK_MEADOW_GORGE.waterThroat.centre.y).toBeLessThan(
      CRYSTAL_BROOK_MEADOW_GORGE.pathOpening.y - 140,
    );
    expect(CRYSTAL_BROOK_MEADOW_GORGE.overhang.y).toBeLessThan(
      CRYSTAL_BROOK_MEADOW_GORGE.pathOpening.y,
    );
    expect(CRYSTAL_BROOK_MEADOW_GORGE.rockFaces.some(({ id }) => id === 'inner-divider')).toBe(
      true,
    );
  });

  it('defines a carved Rainbow Meadow waymarker with a west-pointing arrow', () => {
    expect(CRYSTAL_BROOK_MEADOW_GORGE.sign.label).toBe('RAINBOW MEADOW');
    expect(CRYSTAL_BROOK_MEADOW_GORGE.sign.arrow).toBe('←');
    expect(CRYSTAL_BROOK_MEADOW_GORGE.sign.x).toBeGreaterThan(
      CRYSTAL_BROOK_LAYOUT.thresholds.rainbowMeadow.position.x,
    );
    expect(CRYSTAL_BROOK_MEADOW_GORGE.sign.y).toBeGreaterThan(
      CRYSTAL_BROOK_LAYOUT.thresholds.rainbowMeadow.position.y,
    );
  });

  it('keeps both Meadow-Brook arrival points outside the walk-through trigger radius', () => {
    const brookThreshold = CRYSTAL_BROOK_LAYOUT.thresholds.rainbowMeadow;
    const brookArrivalDistance = Math.hypot(
      brookThreshold.approach.x - brookThreshold.position.x,
      brookThreshold.approach.y - brookThreshold.position.y,
    );
    expect(brookArrivalDistance).toBeGreaterThan(WALK_THROUGH_GATEWAY_RADIUS + 40);

    const meadowThreshold = RAINBOW_MEADOW_LAYOUT.crystalBrookGateway;
    const meadowArrivalDistance = Math.hypot(
      meadowThreshold.approach.x - meadowThreshold.position.x,
      meadowThreshold.approach.y - meadowThreshold.position.y,
    );
    expect(meadowArrivalDistance).toBeGreaterThan(WALK_THROUGH_GATEWAY_RADIUS + 20);
  });

  it('uses a northward crossing followed by an eastward glacial bridge crossing', () => {
    expect(CRYSTAL_BROOK_ICE_BRIDGES).toHaveLength(2);
    const meadowTrail = CRYSTAL_BROOK_LOCAL_TRAILS.find(({ id }) => id === 'meadow-south-bank');
    const bridgeLink = CRYSTAL_BROOK_LOCAL_TRAILS.find(({ id }) => id === 'bridge-link');
    const woodsPass = CRYSTAL_BROOK_LOCAL_TRAILS.find(({ id }) => id === 'woods-pass');

    expect(meadowTrail?.points.at(-1)).toEqual(CRYSTAL_BROOK_NORTH_BRIDGE.startLanding);
    expect(bridgeLink?.points[0]).toEqual(CRYSTAL_BROOK_NORTH_BRIDGE.endLanding);
    expect(bridgeLink?.points.at(-1)).toEqual(CRYSTAL_BROOK_EAST_BRIDGE.startLanding);
    expect(woodsPass?.points[0]).toEqual(CRYSTAL_BROOK_EAST_BRIDGE.endLanding);

    expect(CRYSTAL_BROOK_NORTH_BRIDGE.endLanding.y).toBeLessThan(
      CRYSTAL_BROOK_NORTH_BRIDGE.startLanding.y - 200,
    );
    expect(CRYSTAL_BROOK_EAST_BRIDGE.endLanding.x).toBeGreaterThan(
      CRYSTAL_BROOK_EAST_BRIDGE.startLanding.x + 250,
    );
    expect(
      Math.abs(CRYSTAL_BROOK_EAST_BRIDGE.endLanding.y - CRYSTAL_BROOK_EAST_BRIDGE.startLanding.y),
    ).toBeLessThan(60);

    for (const bridge of CRYSTAL_BROOK_ICE_BRIDGES) {
      expect(bridge.length).toBeGreaterThanOrEqual(290);
      expect(bridge.deckWidth).toBeLessThan(110);
    }
  });

  it('keeps Crystal Cup north, Woods low-east and Prism Grotto clearly south', () => {
    expect(CRYSTAL_BROOK_LAYOUT.thresholds.crystalCupHub.position.y).toBeLessThanOrEqual(140);
    expect(CRYSTAL_BROOK_LAYOUT.thresholds.crystalCupHub.approach.y).toBeGreaterThan(
      CRYSTAL_BROOK_LAYOUT.thresholds.crystalCupHub.position.y,
    );
    expect(CRYSTAL_BROOK_LAYOUT.thresholds.whisperingWoods.position.x).toBeGreaterThanOrEqual(3380);
    expect(CRYSTAL_BROOK_LAYOUT.thresholds.whisperingWoods.position.y).toBeGreaterThan(1500);
    expect(CRYSTAL_BROOK_LAYOUT.thresholds.crystalGrotto.position.y).toBeGreaterThan(2000);
    expect(CRYSTAL_BROOK_LAYOUT.thresholds.crystalGrotto.position.x).toBeLessThan(2600);
  });

  it('lets the east Brook disappear off-map into the woodland edge', () => {
    expect(CRYSTAL_BROOK_WATERCOURSE[0].x).toBeGreaterThan(CRYSTAL_BROOK_MAP.width);
    expect(CRYSTAL_BROOK_WATERCOURSE[0].y).toBeGreaterThan(650);
    expect(CRYSTAL_BROOK_WATERCOURSE[0].y).toBeLessThan(900);
  });

  it('shares one authored path junction between the bridge link and Crystal Cup spur', () => {
    const bridgeLink = CRYSTAL_BROOK_LOCAL_TRAILS.find(({ id }) => id === 'bridge-link');
    const crystalCup = CRYSTAL_BROOK_LOCAL_TRAILS.find(({ id }) => id === 'crystal-cup');

    expect(bridgeLink?.points).toContain(CRYSTAL_BROOK_CRYSTAL_CUP_JUNCTION);
    expect(crystalCup?.points[0]).toEqual(CRYSTAL_BROOK_CRYSTAL_CUP_JUNCTION);
    expect(CRYSTAL_BROOK_LAYOUT.routes.crystalCupHub[0]).toEqual(
      CRYSTAL_BROOK_CRYSTAL_CUP_JUNCTION,
    );
  });

  it('keeps reserved activity pockets connected without adding water-crossing side paths', () => {
    const crystalarium = CRYSTAL_BROOK_LOCAL_TRAILS.find(({ id }) => id === 'crystalarium');
    const checkers = CRYSTAL_BROOK_LOCAL_TRAILS.find(({ id }) => id === 'crystal-checkers');

    expect(CRYSTAL_BROOK_LOCAL_TRAILS.some(({ id }) => id.includes('stepping-stones'))).toBe(false);
    expect(crystalarium?.points.at(-1)).toEqual(CRYSTAL_BROOK_ACTIVITY_POCKETS[0].approach);
    expect(checkers?.points.at(-1)).toEqual(CRYSTAL_BROOK_ACTIVITY_POCKETS[1].approach);
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
