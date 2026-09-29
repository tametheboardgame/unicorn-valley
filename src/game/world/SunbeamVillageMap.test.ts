import { describe, expect, it } from 'vitest';
import {
  findUnreachableTargets,
  isPointBlocked,
  isPointInsideWalkableBounds,
} from './MapTraversal';
import { resolveSunbeamShopRoofAnchor, SUNBEAM_VILLAGE_LAYOUT } from './SunbeamVillageLayout';
import { SUNBEAM_VILLAGE_MAP } from './SunbeamVillageMap';

const PLAYER_CLEARANCE = 42;

describe('Sunbeam Village map', () => {
  it('keeps the spawn and all interaction approaches reachable', () => {
    expect(
      isPointInsideWalkableBounds(
        SUNBEAM_VILLAGE_MAP,
        SUNBEAM_VILLAGE_MAP.playerSpawn,
        PLAYER_CLEARANCE,
      ),
    ).toBe(true);
    expect(
      isPointBlocked(
        SUNBEAM_VILLAGE_MAP.playerSpawn,
        SUNBEAM_VILLAGE_MAP.colliders,
        PLAYER_CLEARANCE,
      ),
    ).toBe(false);

    const targets = [
      ...SUNBEAM_VILLAGE_MAP.landmarks.map((landmark) => ({
        id: `landmark:${landmark.id}`,
        position: landmark.approach,
      })),
      ...SUNBEAM_VILLAGE_MAP.entrances.map((entrance) => ({
        id: `entrance:${entrance.id}`,
        position: entrance.approach,
      })),
      ...SUNBEAM_VILLAGE_MAP.npcMarkers.map((marker) => ({
        id: `npc:${marker.id}`,
        position: marker.position,
      })),
      {
        id: 'district:willow-garden',
        position: SUNBEAM_VILLAGE_LAYOUT.willowGarden.approach,
      },
      ...SUNBEAM_VILLAGE_LAYOUT.residences.map((residence) => ({
        id: `residence:${residence.id}`,
        position: residence.approach,
      })),
      {
        id: 'future:south-gate',
        position: SUNBEAM_VILLAGE_LAYOUT.boundaryFence.lockedSouthGate.approach,
      },
      {
        id: 'activity:sunbeam-chess',
        position: SUNBEAM_VILLAGE_LAYOUT.chessPlaza.table.interaction,
      },
    ];

    expect(findUnreachableTargets(SUNBEAM_VILLAGE_MAP, targets)).toEqual([]);
  });

  it('contains only authoritative production NPC markers and no legacy square topology', () => {
    expect(SUNBEAM_VILLAGE_MAP.npcMarkers.map((marker) => marker.id)).toEqual([
      'willow',
      'marigold',
      'pebble',
    ]);
    expect('square' in SUNBEAM_VILLAGE_MAP).toBe(false);
  });

  it('only blocks visible physical landmarks', () => {
    expect(SUNBEAM_VILLAGE_MAP.colliders.map((collider) => collider.id)).toEqual([
      'collision:bakery',
      'collision:accessory-shop',
      'collision:library',
      'collision:residence:rosehip-cottage',
      'collision:residence:bluebell-cottage',
      'collision:residence:sunpetal-cottage',
      'collision:fountain',
      'collision:playground:seesaw',
      'collision:playground:slide',
      'collision:playground:climbingFrame',
      'collision:playground:shrub:north-west',
      'collision:playground:shrub:north-west-centre',
      'collision:playground:shrub:north-centre',
      'collision:playground:shrub:north-east-centre',
      'collision:playground:shrub:north-east',
      'collision:landscaping:tree:bakery-thread',
      'collision:landscaping:tree:thread-story',
      'collision:landscaping:shrub:bakery-thread-left',
      'collision:landscaping:shrub:bakery-thread-right',
      'collision:landscaping:shrub:thread-story-left',
      'collision:landscaping:shrub:thread-story-right',
      'collision:landscaping:flower-bed:bakery-green',
      'collision:landscaping:flower-bed:story-green',
      'collision:landscaping:flower-bed:west-green',
      'collision:landscaping:flower-bed:east-green',
      'collision:village-life:sundial',
      'collision:chess-plaza:table',
      'collision:chess-plaza:bench:west',
      'collision:chess-plaza:bench:east',
      'collision:chess-plaza:bench:south',
      'collision:willow-garden:west',
      'collision:willow-garden:south',
      'collision:willow-garden:east-lower',
      'collision:willow-garden:north-left',
      'collision:willow-garden:sign',
      'collision:village-boundary:north',
      'collision:village-boundary:south-left',
      'collision:village-boundary:south-right',
      'collision:village-boundary:west-north',
      'collision:village-boundary:west-south',
      'collision:village-boundary:east-north',
      'collision:village-boundary:east-south',
      'collision:village-boundary:locked-south-gate',
    ]);
  });

  it('keeps the fountain interaction reachable outside its physical collider', () => {
    expect(SUNBEAM_VILLAGE_LAYOUT.fountain.interactionRadius).toBeGreaterThan(
      SUNBEAM_VILLAGE_LAYOUT.fountain.collisionWidth / 2 + PLAYER_CLEARANCE,
    );
    expect(SUNBEAM_VILLAGE_LAYOUT.fountain.interactionRadius).toBeGreaterThan(
      SUNBEAM_VILLAGE_LAYOUT.fountain.collisionHeight / 2 + PLAYER_CLEARANCE,
    );
  });

  it('keeps Marigold clear of the fountain make-a-wish interaction', () => {
    const marigold = SUNBEAM_VILLAGE_LAYOUT.npcPositions.marigold;
    const fountain = SUNBEAM_VILLAGE_LAYOUT.fountain;
    const distance = Math.hypot(marigold.x - fountain.approach.x, marigold.y - fountain.approach.y);

    expect(distance).toBeGreaterThan(150 + 145);
  });

  it('reserves enough space between NPC markers for separate interactions', () => {
    const markers = SUNBEAM_VILLAGE_MAP.npcMarkers;

    for (let left = 0; left < markers.length; left += 1) {
      for (let right = left + 1; right < markers.length; right += 1) {
        const distance = Math.hypot(
          markers[left].position.x - markers[right].position.x,
          markers[left].position.y - markers[right].position.y,
        );
        expect(distance).toBeGreaterThanOrEqual(220);
      }
    }
  });

  it('defines six distinct districts and spreads major activity across the map', () => {
    expect(SUNBEAM_VILLAGE_LAYOUT.districts.map(({ id }) => id)).toEqual([
      'west-approach',
      'high-street',
      'central-plaza',
      'willow-garden',
      'residential',
      'east-approach',
    ]);

    const shops = [
      SUNBEAM_VILLAGE_LAYOUT.buildings.bakery,
      SUNBEAM_VILLAGE_LAYOUT.buildings.accessoryShop,
      SUNBEAM_VILLAGE_LAYOUT.buildings.library,
    ];
    expect(shops[1].x - shops[0].x).toBeGreaterThanOrEqual(650);
    expect(shops[2].x - shops[1].x).toBeGreaterThanOrEqual(700);

    expect(SUNBEAM_VILLAGE_LAYOUT.willowGarden.x).toBeLessThan(900);
    expect(SUNBEAM_VILLAGE_LAYOUT.willowGarden.y).toBeGreaterThan(1300);
    expect(SUNBEAM_VILLAGE_LAYOUT.pathNetwork.southernRoad).toContainEqual(
      SUNBEAM_VILLAGE_LAYOUT.npcPositions.pebble,
    );
    expect(SUNBEAM_VILLAGE_LAYOUT.fountain.y).toBeGreaterThan(950);
  });

  it('keeps master-layout interaction anchors deliberately separated', () => {
    const anchors = [
      ...Object.values(SUNBEAM_VILLAGE_LAYOUT.npcPositions),
      SUNBEAM_VILLAGE_LAYOUT.villageLife.noticeBoard,
      SUNBEAM_VILLAGE_LAYOUT.villageLife.sundial,
      SUNBEAM_VILLAGE_LAYOUT.villageLife.bench,
      SUNBEAM_VILLAGE_LAYOUT.villageLife.threadWindow,
    ];

    for (let left = 0; left < anchors.length; left += 1) {
      for (let right = left + 1; right < anchors.length; right += 1) {
        expect(
          Math.hypot(anchors[left].x - anchors[right].x, anchors[left].y - anchors[right].y),
        ).toBeGreaterThanOrEqual(150);
      }
    }
  });

  it('keeps the H3.3 path network tied to canonical destinations', () => {
    const {
      mainApproaches,
      shopBranches,
      willowBranch,
      southernRoad,
      residentialSideRoads,
      chessPlazaBranch,
    } = SUNBEAM_VILLAGE_LAYOUT.pathNetwork;

    expect(mainApproaches[0]).toContainEqual(
      SUNBEAM_VILLAGE_LAYOUT.entrances.moonflowerGlade.position,
    );
    expect(mainApproaches[0][0].x).toBeLessThan(0);
    expect(mainApproaches[1]).toContainEqual(
      SUNBEAM_VILLAGE_LAYOUT.entrances.rainbowMeadow.position,
    );
    expect(mainApproaches[1].at(-1)?.x).toBeGreaterThan(SUNBEAM_VILLAGE_LAYOUT.map.width);
    expect(shopBranches.map((branch) => branch.at(-2))).toEqual([
      SUNBEAM_VILLAGE_LAYOUT.buildings.bakery.approach,
      SUNBEAM_VILLAGE_LAYOUT.buildings.accessoryShop.approach,
      SUNBEAM_VILLAGE_LAYOUT.buildings.library.approach,
    ]);
    expect(shopBranches.map((branch) => branch.at(-1))).toEqual([
      SUNBEAM_VILLAGE_LAYOUT.buildings.bakery.doorstep,
      SUNBEAM_VILLAGE_LAYOUT.buildings.accessoryShop.doorstep,
      SUNBEAM_VILLAGE_LAYOUT.buildings.library.doorstep,
    ]);
    expect(willowBranch.at(-1)).toEqual(SUNBEAM_VILLAGE_LAYOUT.willowGarden.approach);
    expect(willowBranch).toHaveLength(7);

    expect(southernRoad[0]).toEqual(mainApproaches[1][0]);
    expect(southernRoad.at(-1)).toEqual({
      x: SUNBEAM_VILLAGE_LAYOUT.boundaryFence.lockedSouthGate.x,
      y: SUNBEAM_VILLAGE_LAYOUT.boundaryFence.lockedSouthGate.y,
    });
    expect(southernRoad).toContainEqual(SUNBEAM_VILLAGE_LAYOUT.npcPositions.pebble);
    expect(southernRoad).toContainEqual(residentialSideRoads[0][0]);
    expect(southernRoad).toContainEqual(residentialSideRoads[1][0]);

    const [rosehip, bluebell, sunpetal] = SUNBEAM_VILLAGE_LAYOUT.residences;
    expect(residentialSideRoads[0]).toContainEqual(rosehip.approach);
    expect(residentialSideRoads[0]).toContainEqual(bluebell.approach);
    expect(residentialSideRoads[1]).toContainEqual(sunpetal.approach);

    const chessPlazaTop = SUNBEAM_VILLAGE_LAYOUT.chessPlaza.centre.y -
      SUNBEAM_VILLAGE_LAYOUT.chessPlaza.height / 2;
    expect(chessPlazaBranch.at(-1)?.x).toBe(SUNBEAM_VILLAGE_LAYOUT.chessPlaza.centre.x);
    expect(chessPlazaBranch.at(-1)?.y).toBeGreaterThanOrEqual(chessPlazaTop - 10);
    expect(chessPlazaBranch[0].y).toBeLessThan(SUNBEAM_VILLAGE_LAYOUT.chessPlaza.centre.y);
  });

  it('anchors high-street bunting to canonical shop roof corners', () => {
    const [bakeryToThread, threadToStory] = SUNBEAM_VILLAGE_LAYOUT.highStreetBunting;

    expect(
      resolveSunbeamShopRoofAnchor(bakeryToThread.from.building, bakeryToThread.from.anchor),
    ).toEqual({
      x: 945,
      y: 395,
    });
    expect(
      resolveSunbeamShopRoofAnchor(bakeryToThread.to.building, bakeryToThread.to.anchor),
    ).toEqual({
      x: 1224,
      y: 298,
    });
    expect(
      resolveSunbeamShopRoofAnchor(threadToStory.from.building, threadToStory.from.anchor),
    ).toEqual({
      x: 1674,
      y: 298,
    });
    expect(
      resolveSunbeamShopRoofAnchor(threadToStory.to.building, threadToStory.to.anchor),
    ).toEqual({
      x: 2008,
      y: 380,
    });
  });

  it('runs the Twinkle & Thread branch directly beneath the north edge of the plaza', () => {
    const { centre, height } = SUNBEAM_VILLAGE_LAYOUT.plaza;
    const accessoryBranch = SUNBEAM_VILLAGE_LAYOUT.pathNetwork.shopBranches[1];
    const branchPlazaEnd = accessoryBranch[0];
    const plazaTop = centre.y - height / 2;

    expect(branchPlazaEnd.x).toBe(SUNBEAM_VILLAGE_LAYOUT.buildings.accessoryShop.x);
    expect(branchPlazaEnd.y).toBeGreaterThan(plazaTop + 30);
    expect(accessoryBranch[1].y).toBeLessThan(plazaTop);
  });

  it('keeps H3.8 village-life pockets outside the fountain circulation ring', () => {
    const { villageLife, fountain, plaza, buildings } = SUNBEAM_VILLAGE_LAYOUT;
    for (const point of [villageLife.noticeBoard, villageLife.sundial, villageLife.bench]) {
      expect(Math.hypot(point.x - fountain.x, point.y - fountain.y)).toBeGreaterThan(
        plaza.fountainClearance + 80,
      );
    }

    expect(villageLife.threadWindow.y).toBe(buildings.accessoryShop.approach.y);
    expect(
      Math.abs(villageLife.threadWindow.x - buildings.accessoryShop.approach.x),
    ).toBeGreaterThan(90);
  });

  it('authors H3.11.8B landscaping in deliberate village pockets', () => {
    const { landscaping, buildings, villageLife } = SUNBEAM_VILLAGE_LAYOUT;
    const [bakeryThreadTree, threadStoryTree] = landscaping.highStreet.trees;

    expect(landscaping.highStreet.trees).toHaveLength(2);
    expect(landscaping.highStreet.shrubs).toHaveLength(4);
    expect(landscaping.flowerBeds).toHaveLength(4);

    expect(bakeryThreadTree.x).toBeGreaterThan(buildings.bakery.x + buildings.bakery.width / 2);
    expect(bakeryThreadTree.x).toBeLessThan(
      buildings.accessoryShop.x - buildings.accessoryShop.width / 2,
    );
    expect(threadStoryTree.x).toBeGreaterThan(
      buildings.accessoryShop.x + buildings.accessoryShop.width / 2,
    );
    expect(threadStoryTree.x).toBeLessThan(buildings.library.x - buildings.library.width / 2);

    const landscapingIds = [
      ...landscaping.highStreet.trees.map(({ id }) => `tree:${id}`),
      ...landscaping.highStreet.shrubs.map(({ id }) => `shrub:${id}`),
      ...landscaping.flowerBeds.map(({ id }) => `flower-bed:${id}`),
    ];
    expect(new Set(landscapingIds).size).toBe(landscapingIds.length);

    const eastGreen = landscaping.flowerBeds.find(({ id }) => id === 'east-green');
    const sunpetal = SUNBEAM_VILLAGE_LAYOUT.residences.find(({ id }) => id === 'sunpetal-cottage');
    expect(eastGreen).toBeDefined();
    expect(sunpetal).toBeDefined();
    if (eastGreen && sunpetal) {
      const bedLeft = eastGreen.x - eastGreen.width / 2;
      const bedRight = eastGreen.x + eastGreen.width / 2;
      const bedTop = eastGreen.y - eastGreen.height / 2;
      const bedBottom = eastGreen.y + eastGreen.height / 2;
      const houseLeft = sunpetal.x - sunpetal.width / 2;
      const houseRight = sunpetal.x + sunpetal.width / 2;
      const houseTop = sunpetal.y - sunpetal.height / 2;
      const houseBottom = sunpetal.y + sunpetal.height / 2;
      const overlaps =
        bedLeft < houseRight &&
        bedRight > houseLeft &&
        bedTop < houseBottom &&
        bedBottom > houseTop;

      expect(overlaps).toBe(false);
    }

    expect(villageLife.sundial.x).toBeGreaterThan(1830);
    expect(villageLife.sundial.y).toBeLessThan(1320);
  });

  it('places the village bench in a quiet south-west lawn pocket away from residential circulation', () => {
    const { bench } = SUNBEAM_VILLAGE_LAYOUT.villageLife;
    const { centre, height } = SUNBEAM_VILLAGE_LAYOUT.plaza;

    expect(bench.x).toBeLessThan(centre.x);
    expect(bench.y).toBeGreaterThan(centre.y + height / 2);
    expect(
      Math.hypot(
        bench.x - SUNBEAM_VILLAGE_LAYOUT.fountain.x,
        bench.y - SUNBEAM_VILLAGE_LAYOUT.fountain.y,
      ),
    ).toBeGreaterThan(300);
    for (const residence of SUNBEAM_VILLAGE_LAYOUT.residences) {
      expect(Math.hypot(bench.x - residence.x, bench.y - residence.y)).toBeGreaterThan(400);
    }
  });

  it('uses the plaza as the main-road connection instead of crossing the fountain', () => {
    const { x, y } = SUNBEAM_VILLAGE_LAYOUT.fountain;
    const minimumDistance = SUNBEAM_VILLAGE_LAYOUT.plaza.fountainClearance;
    const [westApproach, eastApproach] = SUNBEAM_VILLAGE_LAYOUT.pathNetwork.mainApproaches;
    const westPlazaEnd = westApproach.at(-1);
    const eastPlazaStart = eastApproach[0];

    expect(westPlazaEnd?.x).toBeLessThan(x);
    expect(eastPlazaStart?.x).toBeGreaterThan(x);
    expect(Math.abs((westPlazaEnd?.y ?? y) - y)).toBeLessThanOrEqual(20);
    expect(Math.abs((eastPlazaStart?.y ?? y) - y)).toBeLessThanOrEqual(20);

    for (const point of [...westApproach, ...eastApproach]) {
      expect(Math.hypot(point.x - x, point.y - y)).toBeGreaterThanOrEqual(minimumDistance);
    }
  });

  it('composes Willow and her garden as a south-west village-edge district', () => {
    const { willowGarden, npcPositions } = SUNBEAM_VILLAGE_LAYOUT;
    const oldGarden = { x: 650, y: 1470 };
    const oldWillow = { x: 680, y: 1290 };

    expect(willowGarden.x).toBeLessThan(oldGarden.x);
    expect(willowGarden.y).toBeGreaterThan(oldGarden.y);
    expect(npcPositions.willow.x).toBeLessThan(oldWillow.x);
    expect(npcPositions.willow.y).toBeGreaterThan(oldWillow.y);

    expect(willowGarden.width).toBeGreaterThanOrEqual(520);
    expect(willowGarden.height).toBeGreaterThanOrEqual(300);
    expect(willowGarden.beds).toHaveLength(4);
    expect(willowGarden.fenceSegments).toHaveLength(4);
    expect(willowGarden.fencePosts).toHaveLength(5);

    expect(
      Math.hypot(
        npcPositions.willow.x - willowGarden.approach.x,
        npcPositions.willow.y - willowGarden.approach.y,
      ),
    ).toBeLessThan(150);
  });

  it('derives Willow garden fence collision from canonical visible or clearance geometry', () => {
    for (const segment of SUNBEAM_VILLAGE_LAYOUT.willowGarden.fenceSegments) {
      const geometry = 'collision' in segment ? segment.collision : segment;
      const collider = SUNBEAM_VILLAGE_MAP.colliders.find(
        ({ id }) => id === `collision:willow-garden:${segment.id}`,
      );
      expect(collider).toEqual({
        id: `collision:willow-garden:${segment.id}`,
        x: SUNBEAM_VILLAGE_LAYOUT.willowGarden.x + geometry.x,
        y: SUNBEAM_VILLAGE_LAYOUT.willowGarden.y + geometry.y,
        width: geometry.width,
        height: geometry.height,
      });
    }

    expect(
      SUNBEAM_VILLAGE_MAP.colliders.find(({ id }) => id === 'collision:willow-garden:north-left'),
    ).toMatchObject({ height: 66 });
    expect(
      SUNBEAM_VILLAGE_MAP.colliders.find(({ id }) => id === 'collision:willow-garden:south'),
    ).toMatchObject({ height: 66 });
  });

  it('gives every H3.11.8B landscaping prop physical collision', () => {
    const { landscaping, villageLife } = SUNBEAM_VILLAGE_LAYOUT;

    for (const tree of landscaping.highStreet.trees) {
      expect(
        SUNBEAM_VILLAGE_MAP.colliders.find(
          ({ id }) => id === `collision:landscaping:tree:${tree.id}`,
        ),
      ).toEqual({
        id: `collision:landscaping:tree:${tree.id}`,
        ...tree.collision,
      });
    }

    for (const shrub of landscaping.highStreet.shrubs) {
      expect(
        SUNBEAM_VILLAGE_MAP.colliders.find(
          ({ id }) => id === `collision:landscaping:shrub:${shrub.id}`,
        ),
      ).toEqual({
        id: `collision:landscaping:shrub:${shrub.id}`,
        ...shrub.collision,
      });
    }

    for (const bed of landscaping.flowerBeds) {
      expect(
        SUNBEAM_VILLAGE_MAP.colliders.find(
          ({ id }) => id === `collision:landscaping:flower-bed:${bed.id}`,
        ),
      ).toEqual({
        id: `collision:landscaping:flower-bed:${bed.id}`,
        ...bed.collision,
      });

      const visualTop = bed.y + 4 - bed.height / 2;
      const visualBottom = bed.y + 4 + bed.height / 2;
      const collisionTop = bed.collision.y - bed.collision.height / 2;
      const collisionBottom = bed.collision.y + bed.collision.height / 2;

      expect(bed.collision.width).toBeGreaterThanOrEqual(bed.width);
      expect(collisionTop).toBeLessThanOrEqual(visualTop - 20);
      expect(collisionTop).toBeGreaterThanOrEqual(visualTop - 24);
      expect(collisionBottom).toBeGreaterThanOrEqual(visualBottom);
    }

    expect(
      SUNBEAM_VILLAGE_MAP.colliders.find(({ id }) => id === 'collision:village-life:sundial'),
    ).toEqual({
      id: 'collision:village-life:sundial',
      ...villageLife.sundial.collision,
    });
  });

  it('gives the playground hedge and chess plaza physical collision', () => {
    const { playground, chessPlaza, villageLife } = SUNBEAM_VILLAGE_LAYOUT;

    for (const shrub of playground.shrubs) {
      expect(
        SUNBEAM_VILLAGE_MAP.colliders.find(
          ({ id }) => id === `collision:playground:shrub:${shrub.id}`,
        ),
      ).toEqual({
        id: `collision:playground:shrub:${shrub.id}`,
        x: playground.x + shrub.x,
        y: playground.y + shrub.y,
        width: shrub.width,
        height: shrub.height,
      });
    }

    expect(
      SUNBEAM_VILLAGE_MAP.colliders.find(({ id }) => id === 'collision:chess-plaza:table'),
    ).toEqual({
      id: 'collision:chess-plaza:table',
      ...chessPlaza.table.collision,
    });
    for (const bench of chessPlaza.benches) {
      expect(
        SUNBEAM_VILLAGE_MAP.colliders.find(
          ({ id }) => id === `collision:chess-plaza:bench:${bench.id}`,
        ),
      ).toEqual({
        id: `collision:chess-plaza:bench:${bench.id}`,
        ...bench.collision,
      });
    }
    expect(villageLife.bench).toMatchObject({
      x: chessPlaza.benches[0].x,
      y: chessPlaza.benches[0].y,
      collision: chessPlaza.benches[0].collision,
    });
  });

  it('keeps the chess table interaction reachable below its collider', () => {
    const { table } = SUNBEAM_VILLAGE_LAYOUT.chessPlaza;
    expect(table.interaction.y).toBeGreaterThan(table.collision.y + table.collision.height / 2);
    expect(
      isPointBlocked(table.interaction, SUNBEAM_VILLAGE_MAP.colliders, PLAYER_CLEARANCE),
    ).toBe(false);
  });

  it('gives Willow garden sign visual-clearance collision', () => {
    const { willowGarden } = SUNBEAM_VILLAGE_LAYOUT;
    expect(
      SUNBEAM_VILLAGE_MAP.colliders.find(({ id }) => id === 'collision:willow-garden:sign'),
    ).toEqual({
      id: 'collision:willow-garden:sign',
      x: willowGarden.x + willowGarden.sign.collision.x,
      y: willowGarden.y + willowGarden.sign.collision.y,
      width: willowGarden.sign.collision.width,
      height: willowGarden.sign.collision.height,
    });

    expect(willowGarden.sign.collision.width).toBeGreaterThan(willowGarden.sign.width);
    expect(willowGarden.sign.collision.height).toBeGreaterThan(willowGarden.sign.height);
  });

  it('derives the village perimeter collision from canonical visible or clearance geometry', () => {
    const { boundaryFence } = SUNBEAM_VILLAGE_LAYOUT;

    expect(boundaryFence.segments).toHaveLength(7);
    expect(boundaryFence.posts).toHaveLength(10);

    for (const segment of boundaryFence.segments) {
      const collider = SUNBEAM_VILLAGE_MAP.colliders.find(
        ({ id }) => id === `collision:village-boundary:${segment.id}`,
      );
      const expected =
        'collision' in segment
          ? segment.collision
          : {
              x: segment.x,
              y: segment.y,
              width:
                segment.orientation === 'horizontal' ? segment.length : boundaryFence.thickness,
              height: segment.orientation === 'vertical' ? segment.length : boundaryFence.thickness,
            };
      expect(collider).toEqual({
        id: `collision:village-boundary:${segment.id}`,
        ...expected,
      });
    }
  });

  it('places the southern village perimeter on the canvas edge with the Candyland opening-soon gate', () => {
    const { boundaryFence, map } = SUNBEAM_VILLAGE_LAYOUT;
    const southLeft = boundaryFence.segments.find(({ id }) => id === 'south-left');
    const southRight = boundaryFence.segments.find(({ id }) => id === 'south-right');
    const westSouth = boundaryFence.segments.find(({ id }) => id === 'west-south');
    const eastSouth = boundaryFence.segments.find(({ id }) => id === 'east-south');
    const gate = boundaryFence.lockedSouthGate;

    expect(southLeft?.y).toBe(boundaryFence.southEdgeY);
    expect(southRight?.y).toBe(boundaryFence.southEdgeY);
    expect((southLeft?.y ?? 0) + boundaryFence.thickness / 2).toBe(map.height);
    expect((southRight?.y ?? 0) + boundaryFence.thickness / 2).toBe(map.height);
    expect((westSouth?.y ?? 0) + (westSouth?.length ?? 0) / 2).toBe(boundaryFence.southEdgeY);
    expect((eastSouth?.y ?? 0) + (eastSouth?.length ?? 0) / 2).toBe(boundaryFence.southEdgeY);

    expect((southLeft?.x ?? 0) + (southLeft?.length ?? 0) / 2).toBe(gate.x - gate.width / 2);
    expect((southRight?.x ?? 0) - (southRight?.length ?? 0) / 2).toBe(gate.x + gate.width / 2);
    expect(
      SUNBEAM_VILLAGE_MAP.colliders.find(
        ({ id }) => id === 'collision:village-boundary:locked-south-gate',
      ),
    ).toEqual({
      id: 'collision:village-boundary:locked-south-gate',
      x: gate.x,
      y: gate.y - 12,
      width: gate.width,
      height: gate.height,
    });
    expect(gate.destination).toBe('Candyland');
    expect(gate.status).toBe('opening-soon');
  });

  it('leaves deliberate west and east openings through the perimeter fence', () => {
    for (const entrance of SUNBEAM_VILLAGE_MAP.entrances) {
      expect(
        isPointBlocked(entrance.position, SUNBEAM_VILLAGE_MAP.colliders, PLAYER_CLEARANCE),
      ).toBe(false);
    }
  });

  it('builds residential side roads around the cottage frontages', () => {
    const residences = SUNBEAM_VILLAGE_LAYOUT.residences;

    expect(residences.map(({ id }) => id)).toEqual([
      'rosehip-cottage',
      'bluebell-cottage',
      'sunpetal-cottage',
    ]);
    expect(residences).toHaveLength(3);

    for (const residence of residences) {
      expect(residence.facing).toBe('south');
      expect(residence.approach.y).toBeGreaterThan(residence.y);
      expect(
        isPointBlocked(residence.approach, SUNBEAM_VILLAGE_MAP.colliders, PLAYER_CLEARANCE),
      ).toBe(false);
      expect(
        SUNBEAM_VILLAGE_MAP.colliders.find(
          ({ id }) => id === `collision:residence:${residence.id}`,
        ),
      ).toEqual({
        id: `collision:residence:${residence.id}`,
        x: residence.x,
        y: residence.y,
        width: residence.width,
        height: residence.height,
      });
    }

    const [rosehip, bluebell, sunpetal] = residences;
    expect(bluebell.x).toBeLessThan(2200);
    expect(sunpetal.y).toBeLessThan(1380);
    expect(Math.abs(rosehip.approach.y - bluebell.approach.y)).toBeLessThanOrEqual(60);
    expect(SUNBEAM_VILLAGE_LAYOUT.pathNetwork.residentialSideRoads[0]).toContainEqual(
      rosehip.approach,
    );
    expect(SUNBEAM_VILLAGE_LAYOUT.pathNetwork.residentialSideRoads[0]).toContainEqual(
      bluebell.approach,
    );
    const sunpetalSpur = SUNBEAM_VILLAGE_LAYOUT.pathNetwork.residentialSideRoads[1];
    expect(sunpetalSpur).toContainEqual(sunpetal.approach);
    expect(sunpetalSpur).toHaveLength(3);
    expect(sunpetalSpur.every(({ y }) => y === sunpetal.approach.y)).toBe(true);
    expect(SUNBEAM_VILLAGE_LAYOUT.pathNetwork.southernRoad).toContainEqual(sunpetalSpur[0]);

    expect(SUNBEAM_VILLAGE_LAYOUT.pathNetwork.residentialBranches).toEqual([
      [rosehip.approach, { x: 1610, y: 1605 }, rosehip.doorstep, { x: 1594, y: 1530 }],
      [bluebell.approach, { x: 2070, y: 1645 }, bluebell.doorstep, { x: 2093, y: 1545 }],
      [sunpetal.approach, { x: 2548, y: 1378 }, sunpetal.doorstep, { x: 2508, y: 1285 }],
    ]);
    for (const [index, residence] of residences.entries()) {
      expect(residence.doorstep.y).toBeLessThan(residence.approach.y);
      expect(residence.doorstep.y).toBeGreaterThan(residence.y + residence.height / 2);

      const branch = SUNBEAM_VILLAGE_LAYOUT.pathNetwork.residentialBranches[index];
      expect(branch.at(-2)).toEqual(residence.doorstep);
      expect(branch.at(-1)?.y).toBeLessThan(residence.y + residence.height / 2);
    }

    const bluebellRightEdge = bluebell.x + bluebell.width / 2;
    const bluebellBend = SUNBEAM_VILLAGE_LAYOUT.pathNetwork.southernRoad.filter(
      ({ y }) => y >= 1400 && y <= 1600,
    );
    expect(Math.min(...bluebellBend.map(({ x }) => x)) - bluebellRightEdge).toBeGreaterThanOrEqual(
      100,
    );

    for (let left = 0; left < residences.length; left += 1) {
      for (let right = left + 1; right < residences.length; right += 1) {
        expect(
          Math.hypot(
            residences[left].x - residences[right].x,
            residences[left].y - residences[right].y,
          ),
        ).toBeGreaterThan(400);
      }
    }

    expect(new Set(residences.map(({ width, height }) => `${width}x${height}`)).size).toBe(3);
  });

  it('keeps the unicorn playground in the open south-east corner', () => {
    const { playground } = SUNBEAM_VILLAGE_LAYOUT;
    const left = playground.x - playground.width / 2;
    const right = playground.x + playground.width / 2;
    const top = playground.y - playground.height / 2;
    const bottom = playground.y + playground.height / 2;

    expect(left).toBeGreaterThanOrEqual(2450);
    expect(right).toBeLessThan(
      SUNBEAM_VILLAGE_LAYOUT.boundaryFence.segments.find(({ id }) => id === 'east-south')?.x ??
        SUNBEAM_VILLAGE_LAYOUT.map.width,
    );
    expect(bottom).toBeLessThan(SUNBEAM_VILLAGE_LAYOUT.boundaryFence.southEdgeY);
    expect(playground.children).toHaveLength(4);
    for (const child of playground.children) {
      expect(child.x).toBeGreaterThan(left);
      expect(child.x).toBeLessThan(right);
      expect(child.y).toBeGreaterThan(top);
      expect(child.y).toBeLessThan(bottom);
      expect(Math.abs(child.roamX)).toBeGreaterThan(30);
      expect(Math.abs(child.roamY)).toBeGreaterThan(20);
    }
    expect(playground.width).toBeGreaterThanOrEqual(400);
    expect(playground.height).toBeGreaterThanOrEqual(320);
  });

  it('has unique stable IDs for landmarks, entrances and NPC markers', () => {
    const ids = [
      ...SUNBEAM_VILLAGE_MAP.landmarks.map((landmark) => landmark.id),
      ...SUNBEAM_VILLAGE_MAP.entrances.map((entrance) => entrance.id),
      ...SUNBEAM_VILLAGE_MAP.npcMarkers.map((marker) => marker.id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
  });
});
