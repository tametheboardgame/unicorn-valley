import { describe, expect, it } from 'vitest';
import { RAINBOW_MEADOW_LAYOUT, RAINBOW_MEADOW_MAP } from './RainbowMeadowMap';

function isInsideDistrict(
  point: { x: number; y: number },
  district: { centre: { x: number; y: number }; radiusX: number; radiusY: number },
): boolean {
  const dx = (point.x - district.centre.x) / district.radiusX;
  const dy = (point.y - district.centre.y) / district.radiusY;
  return dx * dx + dy * dy <= 1;
}

describe('Rainbow Meadow canonical layout', () => {
  it('projects structural map coordinates from one area-owned layout', () => {
    expect({
      width: RAINBOW_MEADOW_MAP.width,
      height: RAINBOW_MEADOW_MAP.height,
      margin: RAINBOW_MEADOW_MAP.margin,
    }).toEqual(RAINBOW_MEADOW_LAYOUT.bounds);
    expect(RAINBOW_MEADOW_MAP.entrances).toEqual([
      RAINBOW_MEADOW_LAYOUT.sunbeamGateway,
      RAINBOW_MEADOW_LAYOUT.crystalBrookGateway,
    ]);
    expect(RAINBOW_MEADOW_MAP.hubFeatures.map(({ id }) => id)).toEqual([
      'rainbow-run-entrance',
      'windmill-lookout',
    ]);
  });

  it('reserves distinct activity districts before local detail work', () => {
    expect(RAINBOW_MEADOW_LAYOUT.districts.map(({ id }) => id)).toEqual([
      'sunbeam-arrival',
      'north-nature',
      'rainbow-disc-lawn',
      'picnic-hill-reserve',
      'rainbow-run',
      'crystal-brook-corridor',
    ]);

    const sports = RAINBOW_MEADOW_LAYOUT.districts.find(({ id }) => id === 'rainbow-disc-lawn');
    const picnic = RAINBOW_MEADOW_LAYOUT.districts.find(({ id }) => id === 'picnic-hill-reserve');
    const race = RAINBOW_MEADOW_LAYOUT.districts.find(({ id }) => id === 'rainbow-run');
    const crystal = RAINBOW_MEADOW_LAYOUT.districts.find(
      ({ id }) => id === 'crystal-brook-corridor',
    );

    expect(sports).toBeDefined();
    expect(picnic).toBeDefined();
    expect(race).toBeDefined();
    expect(crystal).toBeDefined();
    if (!sports || !picnic || !race || !crystal) {
      return;
    }

    expect(sports.centre.x + sports.radiusX).toBeLessThan(picnic.centre.x - picnic.radiusX);
    expect(race.centre.y + race.radiusY).toBeLessThan(crystal.centre.y - crystal.radiusY);
  });

  it('keeps the future sports lawn and Crystal Brook corridor free of tree clutter', () => {
    const sports = RAINBOW_MEADOW_LAYOUT.districts.find(({ id }) => id === 'rainbow-disc-lawn');
    const crystal = RAINBOW_MEADOW_LAYOUT.districts.find(
      ({ id }) => id === 'crystal-brook-corridor',
    );
    expect(sports).toBeDefined();
    expect(crystal).toBeDefined();
    if (!sports || !crystal) {
      return;
    }

    expect(RAINBOW_MEADOW_LAYOUT.scenery.trees.some((tree) => isInsideDistrict(tree, sports))).toBe(
      false,
    );
    expect(
      RAINBOW_MEADOW_LAYOUT.scenery.trees.some((tree) => isInsideDistrict(tree, crystal)),
    ).toBe(false);
  });

  it('moves the flower-circle cluster into the north nature pocket', () => {
    const nature = RAINBOW_MEADOW_LAYOUT.districts.find(({ id }) => id === 'north-nature');
    expect(nature).toBeDefined();
    if (!nature) {
      return;
    }

    expect(isInsideDistrict(RAINBOW_MEADOW_LAYOUT.natureFeatures.flowerCircle, nature)).toBe(true);
    expect(isInsideDistrict(RAINBOW_MEADOW_LAYOUT.natureFeatures.butterflyParade, nature)).toBe(
      true,
    );
    expect(isInsideDistrict(RAINBOW_MEADOW_LAYOUT.natureFeatures.petalPatch, nature)).toBe(true);
    expect(
      isInsideDistrict(RAINBOW_MEADOW_LAYOUT.discoveryPositions.sunshowerFeather, nature),
    ).toBe(true);
  });

  it('keeps relocated nature interaction hotspots spatially distinct', () => {
    const hotspots = [
      { position: RAINBOW_MEADOW_LAYOUT.natureFeatures.flowerCircle, radius: 150 },
      { position: RAINBOW_MEADOW_LAYOUT.natureFeatures.butterflyParade, radius: 145 },
      { position: RAINBOW_MEADOW_LAYOUT.natureFeatures.petalPatch, radius: 135 },
    ];

    for (let index = 0; index < hotspots.length; index += 1) {
      for (let otherIndex = index + 1; otherIndex < hotspots.length; otherIndex += 1) {
        const current = hotspots[index];
        const other = hotspots[otherIndex];
        expect(
          Math.hypot(current.position.x - other.position.x, current.position.y - other.position.y),
        ).toBeGreaterThan(current.radius + other.radius);
      }
    }

    const established = [
      { position: RAINBOW_MEADOW_LAYOUT.natureFeatures.windmill.storyPosition, radius: 130 },
      { position: RAINBOW_MEADOW_LAYOUT.natureFeatures.windmill.bellPosition, radius: 135 },
      { position: RAINBOW_MEADOW_LAYOUT.natureFeatures.windmill.lookoutPosition, radius: 145 },
      { position: RAINBOW_MEADOW_LAYOUT.natureFeatures.pond.interactionPosition, radius: 130 },
    ];
    for (const hotspot of hotspots) {
      for (const anchor of established) {
        expect(
          Math.hypot(
            hotspot.position.x - anchor.position.x,
            hotspot.position.y - anchor.position.y,
          ),
        ).toBeGreaterThan(hotspot.radius + anchor.radius);
      }
    }
  });

  it('owns one current structural path network for traversal presentation', () => {
    expect(RAINBOW_MEADOW_LAYOUT.structuralPaths.map(({ id }) => id)).toEqual([
      'main-route',
      'windmill-spur',
      'nature-spur',
      'picnic-spur',
      'rainbow-disc-spur',
      'rainbow-run-hub-spur',
      'crystal-brook-spur',
    ]);
    expect(RAINBOW_MEADOW_LAYOUT.structuralPaths.every(({ points }) => points.length >= 2)).toBe(
      true,
    );
  });

  it('runs the west world road off-map and hands the east side to authored destination spurs', () => {
    const main = RAINBOW_MEADOW_LAYOUT.structuralPaths.find(({ id }) => id === 'main-route');
    const race = RAINBOW_MEADOW_LAYOUT.structuralPaths.find(
      ({ id }) => id === 'rainbow-run-hub-spur',
    );
    const crystal = RAINBOW_MEADOW_LAYOUT.structuralPaths.find(
      ({ id }) => id === 'crystal-brook-spur',
    );
    expect(main).toBeDefined();
    expect(race).toBeDefined();
    expect(crystal).toBeDefined();
    if (!main || !race || !crystal) {
      return;
    }

    expect(main.points[0]?.x).toBeLessThan(0);
    expect(
      main.points.some((point) => point.x === RAINBOW_MEADOW_LAYOUT.sunbeamGateway.position.x),
    ).toBe(true);
    expect(race.points[0]).toEqual(main.points[main.points.length - 1]);
    expect(crystal.points[0]).toEqual(main.points[main.points.length - 1]);
    expect(race.points[race.points.length - 1]?.y).toBeLessThan(
      RAINBOW_MEADOW_LAYOUT.bounds.margin + 50,
    );
    expect(crystal.points[crystal.points.length - 1]).toEqual(
      RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea.dryLanding,
    );
  });

  it('keeps every local spur narrower than the main road', () => {
    const main = RAINBOW_MEADOW_LAYOUT.structuralPaths.find(({ id }) => id === 'main-route');
    expect(main).toBeDefined();
    if (!main) {
      return;
    }

    expect(
      RAINBOW_MEADOW_LAYOUT.structuralPaths
        .filter(({ id }) => id !== 'main-route')
        .every(
          ({ outerWidth, innerWidth }) =>
            outerWidth < main.outerWidth && innerWidth < main.innerWidth,
        ),
    ).toBe(true);
  });

  it('hands the Crystal Brook route from road to bank, stones and waterfall threshold', () => {
    const crystal = RAINBOW_MEADOW_LAYOUT.structuralPaths.find(
      ({ id }) => id === 'crystal-brook-spur',
    );
    expect(crystal).toBeDefined();
    if (!crystal) {
      return;
    }

    expect(crystal.points[crystal.points.length - 1]).toEqual(
      RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea.dryLanding,
    );
    expect(RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea.steppingStones).toHaveLength(6);
    const finalStone =
      RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea.steppingStones[
        RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea.steppingStones.length - 1
      ];
    expect(finalStone?.x ?? 0).toBeLessThan(RAINBOW_MEADOW_LAYOUT.crystalBrookGateway.position.x);
  });

  it('owns the waterfall transition and safe return stone in canonical Meadow layout data', () => {
    expect(RAINBOW_MEADOW_LAYOUT.crystalBrookGateway).toEqual({
      id: 'crystal-brook',
      label: 'Crystal Brook',
      position: { x: 3300, y: 1035 },
      approach: { x: 3150, y: 1100 },
      direction: 'east',
    });
    expect(RAINBOW_MEADOW_LAYOUT.crystalBrookGateway.position.x).toBeGreaterThan(
      RAINBOW_MEADOW_LAYOUT.bounds.width - 150,
    );
    expect(
      Math.hypot(
        RAINBOW_MEADOW_LAYOUT.crystalBrookGateway.position.x -
          RAINBOW_MEADOW_LAYOUT.crystalBrookGateway.approach.x,
        RAINBOW_MEADOW_LAYOUT.crystalBrookGateway.position.y -
          RAINBOW_MEADOW_LAYOUT.crystalBrookGateway.approach.y,
      ),
    ).toBeGreaterThan(130);
  });

  it('defines an irregular shallow/deep Crystal Brook basin with a real outflow', () => {
    const area = RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea;
    expect(area.pool.shoreline.length).toBeGreaterThanOrEqual(12);
    expect(area.pool.deepZone.length).toBeGreaterThanOrEqual(10);
    expect(area.steppingStones).toHaveLength(6);
    expect(area.rocks).toHaveLength(7);
    expect(area.crystals.length).toBeGreaterThanOrEqual(4);
    expect(area.mist.length).toBeGreaterThanOrEqual(3);
    expect(area.deepWaterBlockers.length).toBeGreaterThanOrEqual(4);
    expect(area.outletStream.points[area.outletStream.points.length - 1]?.y).toBeGreaterThan(
      RAINBOW_MEADOW_LAYOUT.bounds.height,
    );
  });

  it('parts four overlapping waterfall strands around the hidden recess', () => {
    const waterfall = RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea.waterfall;
    expect(waterfall.openRadius).toBeGreaterThan(200);
    expect(waterfall.curtains.map(({ id }) => id)).toEqual([
      'outer-left',
      'inner-left',
      'inner-right',
      'outer-right',
    ]);
    expect(
      waterfall.curtains.every(({ openOffset, closedOffset }) => openOffset > closedOffset),
    ).toBe(true);
  });

  it('gives every Crystal Brook basin rock a matching collision body', () => {
    const rockColliders = RAINBOW_MEADOW_MAP.colliders.filter(({ id }) =>
      id.startsWith('collision:crystal-brook-gateway-rock:'),
    );
    expect(rockColliders).toHaveLength(RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea.rocks.length);

    RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea.rocks.forEach((rock, index) => {
      expect(rockColliders[index]).toEqual({
        id: `collision:crystal-brook-gateway-rock:${index}`,
        x: rock.x,
        y: rock.y,
        width: rock.collisionWidth,
        height: rock.collisionHeight,
      });
    });
  });

  it('keeps the dry landing and every stepping-stone centre outside deep-water collision', () => {
    const area = RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea;
    const blocked = (point: { x: number; y: number }): boolean =>
      area.deepWaterBlockers.some(
        ({ x, y, width, height }) =>
          Math.abs(point.x - x) <= width / 2 && Math.abs(point.y - y) <= height / 2,
      );

    expect(blocked(area.dryLanding)).toBe(false);
    expect(blocked(area.leftBank)).toBe(false);
    for (const stone of area.steppingStones) {
      expect(blocked(stone)).toBe(false);
    }

    const leftmostShoreX = Math.min(...area.pool.shoreline.map(({ x }) => x));
    expect(area.dryLanding.x).toBeGreaterThan(leftmostShoreX);
    expect(area.dryLanding.x).toBeLessThan(area.steppingStones[0].x);
  });

  it('maps dense deep-water blockers into Meadow collision while preserving the stone corridor', () => {
    const area = RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea;
    const deepColliders = RAINBOW_MEADOW_MAP.colliders.filter(({ id }) =>
      id.startsWith('collision:crystal-brook-deep-water:'),
    );
    expect(deepColliders).toHaveLength(area.deepWaterBlockers.length);
    area.deepWaterBlockers.forEach((blocker, index) => {
      expect(deepColliders[index]).toEqual({
        id: `collision:crystal-brook-deep-water:${index}`,
        ...blocker,
      });
    });

    const landingIsBlocked = deepColliders.some(
      ({ x, y, width, height }) =>
        Math.abs(area.dryLanding.x - x) <= width / 2 &&
        Math.abs(area.dryLanding.y - y) <= height / 2,
    );
    expect(landingIsBlocked).toBe(false);

    for (const sample of [
      { x: 2950, y: 1010 },
      { x: 2870, y: 1320 },
      { x: 3050, y: 1300 },
      { x: 3240, y: 1250 },
    ]) {
      expect(
        deepColliders.some(
          ({ x, y, width, height }) =>
            Math.abs(sample.x - x) <= width / 2 && Math.abs(sample.y - y) <= height / 2,
        ),
      ).toBe(true);
    }
  });

  it('uses materially different Crystal Brook boulder silhouettes', () => {
    const kinds = new Set(RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea.rocks.map(({ kind }) => kind));
    expect(kinds).toEqual(new Set(['slab', 'spire', 'round', 'wedge', 'cluster', 'lopsided']));
    const spire = RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea.rocks.find(
      ({ kind }) => kind === 'spire',
    );
    const round = RAINBOW_MEADOW_LAYOUT.crystalBrookGatewayArea.rocks.find(
      ({ kind }) => kind === 'round',
    );
    expect(spire).toBeDefined();
    expect(round).toBeDefined();
    expect((spire?.height ?? 0) / (spire?.width ?? 1)).toBeGreaterThan(1.5);
    expect(Math.hypot((spire?.x ?? 0) - (round?.x ?? 0), (spire?.y ?? 0) - (round?.y ?? 0))).toBeLessThan(
      150,
    );
  });

  it('keeps the Meadow-side Race Hub gateway clear of tree and flower scenery', () => {
    const race = RAINBOW_MEADOW_LAYOUT.districts.find(({ id }) => id === 'rainbow-run');
    expect(race).toBeDefined();
    if (!race) {
      return;
    }

    expect(RAINBOW_MEADOW_LAYOUT.scenery.trees.some((tree) => isInsideDistrict(tree, race))).toBe(
      false,
    );
    expect(
      RAINBOW_MEADOW_LAYOUT.scenery.flowerClusters.some((flower) => isInsideDistrict(flower, race)),
    ).toBe(false);
  });
});
