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
    expect(RAINBOW_MEADOW_MAP.raceHub).toBe(RAINBOW_MEADOW_LAYOUT.raceHub);
    expect(RAINBOW_MEADOW_MAP.npcMarkers[0]?.position).toBe(
      RAINBOW_MEADOW_LAYOUT.coreNpcPositions.novaRaceHub,
    );
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

  it('runs the main world road beyond both Meadow boundaries', () => {
    const main = RAINBOW_MEADOW_LAYOUT.structuralPaths.find(({ id }) => id === 'main-route');
    expect(main).toBeDefined();
    if (!main) {
      return;
    }

    expect(main.points[0]?.x).toBeLessThan(0);
    expect(main.points[main.points.length - 1]?.x).toBeGreaterThan(
      RAINBOW_MEADOW_LAYOUT.bounds.width,
    );
    expect(
      main.points.some((point) => point.x === RAINBOW_MEADOW_LAYOUT.sunbeamGateway.position.x),
    ).toBe(true);
    expect(
      main.points.some(
        (point) => point.x === RAINBOW_MEADOW_LAYOUT.hubFeatures.rainbowRunEntrance.position.x,
      ),
    ).toBe(true);
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

  it('routes the Crystal Brook spur clear of the ribbon board', () => {
    const crystal = RAINBOW_MEADOW_LAYOUT.structuralPaths.find(
      ({ id }) => id === 'crystal-brook-spur',
    );
    expect(crystal).toBeDefined();
    if (!crystal) {
      return;
    }

    const board = RAINBOW_MEADOW_LAYOUT.hubFeatures.ribbonBoard.position;
    const expandedBoard = {
      left: board.x - 206,
      right: board.x + 206,
      top: board.y - 99,
      bottom: board.y + 99,
    };
    expect(
      crystal.points.some(
        ({ x, y }) =>
          x >= expandedBoard.left &&
          x <= expandedBoard.right &&
          y >= expandedBoard.top &&
          y <= expandedBoard.bottom,
      ),
    ).toBe(false);
  });

  it('runs the Crystal Brook spur through its canonical threshold and beyond the map edge', () => {
    const crystal = RAINBOW_MEADOW_LAYOUT.structuralPaths.find(
      ({ id }) => id === 'crystal-brook-spur',
    );
    expect(crystal).toBeDefined();
    if (!crystal) {
      return;
    }

    expect(
      crystal.points.some(
        ({ x, y }) =>
          x === RAINBOW_MEADOW_LAYOUT.crystalBrookGateway.position.x &&
          y === RAINBOW_MEADOW_LAYOUT.crystalBrookGateway.position.y,
      ),
    ).toBe(true);
    expect(crystal.points[crystal.points.length - 1]?.x).toBeGreaterThan(
      RAINBOW_MEADOW_LAYOUT.bounds.width,
    );
  });

  it('owns the Crystal Brook transition and return approach in canonical Meadow layout data', () => {
    expect(RAINBOW_MEADOW_LAYOUT.crystalBrookGateway).toEqual({
      id: 'crystal-brook',
      label: 'Crystal Brook',
      position: { x: 3290, y: 1900 },
      approach: { x: 3060, y: 1820 },
      direction: 'east',
    });
    expect(RAINBOW_MEADOW_LAYOUT.crystalBrookGateway.position.x).toBeGreaterThan(
      RAINBOW_MEADOW_LAYOUT.bounds.width - 150,
    );
    expect(RAINBOW_MEADOW_LAYOUT.crystalBrookGateway.position.y).toBeGreaterThan(
      RAINBOW_MEADOW_LAYOUT.bounds.height - 300,
    );
  });

  it('makes the Crystal Brook approach progressively rockier toward the threshold', () => {
    const descent = RAINBOW_MEADOW_LAYOUT.crystalBrookDescent;
    expect(descent.terraces).toHaveLength(3);
    expect(descent.rocks.length).toBeGreaterThanOrEqual(8);
    expect(descent.crystals.length).toBeGreaterThanOrEqual(4);
    expect(descent.terraces[0]?.alpha ?? 0).toBeLessThan(descent.terraces[2]?.alpha ?? 0);
  });
});
