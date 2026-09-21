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
      'collision:fountain',
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
    expect(SUNBEAM_VILLAGE_LAYOUT.npcPositions.pebble.y).toBeGreaterThan(1200);
    expect(SUNBEAM_VILLAGE_LAYOUT.fountain.y).toBeGreaterThan(950);
  });

  it('keeps master-layout interaction anchors deliberately separated', () => {
    const anchors = [
      ...Object.values(SUNBEAM_VILLAGE_LAYOUT.npcPositions),
      SUNBEAM_VILLAGE_LAYOUT.villageLife.noticeBoard,
      SUNBEAM_VILLAGE_LAYOUT.villageLife.sundial,
      SUNBEAM_VILLAGE_LAYOUT.villageLife.bench,
      SUNBEAM_VILLAGE_LAYOUT.villageLife.storyMapSign,
      SUNBEAM_VILLAGE_LAYOUT.villageLife.threadWindow,
    ];

    for (let left = 0; left < anchors.length; left += 1) {
      for (let right = left + 1; right < anchors.length; right += 1) {
        expect(Math.hypot(anchors[left].x - anchors[right].x, anchors[left].y - anchors[right].y)).toBeGreaterThanOrEqual(180);
      }
    }
  });

  it('keeps the H3.2 path scaffold tied to canonical entrances and shop approaches', () => {
    const { main, shopBranches } = SUNBEAM_VILLAGE_LAYOUT.pathScaffold;
    expect(main[0]).toEqual(SUNBEAM_VILLAGE_LAYOUT.entrances.moonflowerGlade.position);
    expect(main.at(-1)).toEqual(SUNBEAM_VILLAGE_LAYOUT.entrances.rainbowMeadow.position);
    expect(shopBranches.map((branch) => branch.at(-1))).toEqual([
      SUNBEAM_VILLAGE_LAYOUT.buildings.bakery.approach,
      SUNBEAM_VILLAGE_LAYOUT.buildings.accessoryShop.approach,
      SUNBEAM_VILLAGE_LAYOUT.buildings.library.approach,
    ]);
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
