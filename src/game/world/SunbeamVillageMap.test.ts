import { describe, expect, it } from 'vitest';
import {
  findUnreachableTargets,
  isPointBlocked,
  isPointInsideWalkableBounds,
} from './MapTraversal';
import { SUNBEAM_VILLAGE_LAYOUT } from './SunbeamVillageLayout';
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
        ).toBeGreaterThanOrEqual(180);
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
    } = SUNBEAM_VILLAGE_LAYOUT.pathNetwork;

    expect(mainApproaches[0][0]).toEqual(SUNBEAM_VILLAGE_LAYOUT.entrances.moonflowerGlade.position);
    expect(mainApproaches[1].at(-1)).toEqual(
      SUNBEAM_VILLAGE_LAYOUT.entrances.rainbowMeadow.position,
    );
    expect(shopBranches.map((branch) => branch.at(-1))).toEqual([
      SUNBEAM_VILLAGE_LAYOUT.buildings.bakery.approach,
      SUNBEAM_VILLAGE_LAYOUT.buildings.accessoryShop.approach,
      SUNBEAM_VILLAGE_LAYOUT.buildings.library.approach,
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
  });

  it('blends the Twinkle & Thread branch through a plaza-owned north apron', () => {
    const { northShopApron, centre, height } = SUNBEAM_VILLAGE_LAYOUT.plaza;
    const accessoryBranch = SUNBEAM_VILLAGE_LAYOUT.pathNetwork.shopBranches[1];
    const branchPlazaEnd = accessoryBranch[0];
    const apronTop = northShopApron.y - northShopApron.height / 2;
    const apronBottom = northShopApron.y + northShopApron.height / 2;
    const plazaTop = centre.y - height / 2;

    expect(northShopApron.x).toBe(SUNBEAM_VILLAGE_LAYOUT.buildings.accessoryShop.x);
    expect(branchPlazaEnd.x).toBe(northShopApron.x);
    expect(branchPlazaEnd.y).toBeGreaterThanOrEqual(apronTop);
    expect(branchPlazaEnd.y).toBeLessThanOrEqual(apronBottom);
    expect(apronBottom).toBeGreaterThan(plazaTop);
  });

  it('keeps H3.8 village-life pockets outside the fountain circulation ring', () => {
    const { villageLife, fountain, plaza, buildings } = SUNBEAM_VILLAGE_LAYOUT;
    for (const point of [villageLife.noticeBoard, villageLife.sundial, villageLife.bench]) {
      expect(Math.hypot(point.x - fountain.x, point.y - fountain.y)).toBeGreaterThan(
        plaza.fountainClearance + 80,
      );
    }

    expect(villageLife.threadWindow.y).toBe(buildings.accessoryShop.approach.y);
    expect(Math.abs(villageLife.threadWindow.x - buildings.accessoryShop.approach.x)).toBeGreaterThan(
      90,
    );
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
      SUNBEAM_VILLAGE_MAP.colliders.find(
        ({ id }) => id === 'collision:willow-garden:north-left',
      ),
    ).toMatchObject({ height: 66 });
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
              height:
                segment.orientation === 'vertical' ? segment.length : boundaryFence.thickness,
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
      height: gate.height + 24,
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

    const bluebellRightEdge = bluebell.x + bluebell.width / 2;
    const bluebellBend = SUNBEAM_VILLAGE_LAYOUT.pathNetwork.southernRoad.filter(
      ({ y }) => y >= 1400 && y <= 1600,
    );
    expect(
      Math.min(...bluebellBend.map(({ x }) => x)) - bluebellRightEdge,
    ).toBeGreaterThanOrEqual(100);

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
    expect(right).toBeLessThan(SUNBEAM_VILLAGE_LAYOUT.boundaryFence.segments.find(
      ({ id }) => id === 'east-south',
    )?.x ?? SUNBEAM_VILLAGE_LAYOUT.map.width);
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
