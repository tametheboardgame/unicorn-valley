import { describe, expect, it } from 'vitest';
import { findUnreachableTargets, isPointBlocked } from './MapTraversal';
import {
  getVillageInteriorMap,
  VILLAGE_INTERIOR_MAPS,
  type VillageInteriorAnchorId,
  type VillageInteriorId,
} from './VillageInteriorMap';

const INTERIOR_IDS: readonly VillageInteriorId[] = [
  'bakery',
  'accessory-shop',
  'library',
  'rosehip-cottage',
  'bluebell-cottage',
  'sunpetal-cottage',
];
const REQUIRED_ANCHORS: readonly VillageInteriorAnchorId[] = [
  'entry',
  'exit',
  'counter',
  'npc-work',
  'primary-feature',
  'secondary-feature',
];

describe('VillageInteriorMap', () => {
  it('uses one house-scale movement shell and a clear interior-side doorway spawn', () => {
    for (const interiorId of INTERIOR_IDS) {
      const map = getVillageInteriorMap(interiorId);
      expect({ width: map.width, height: map.height, margin: map.margin }).toEqual({
        width: 1500,
        height: 1080,
        margin: 64,
      });
      expect(map.playerSpawn).toEqual({ x: 750, y: 870 });
      expect(map.anchors.exit.approach).toEqual({ x: 750, y: 900 });
      expect(isPointBlocked(map.playerSpawn, map.colliders, 30)).toBe(false);
      expect(isPointBlocked(map.anchors.exit.approach, map.colliders, 30)).toBe(false);
    }
  });

  it('gives every supported interior semantic anchors instead of inferred text coordinates', () => {
    for (const interiorId of INTERIOR_IDS) {
      const map = VILLAGE_INTERIOR_MAPS[interiorId];
      expect(Object.keys(map.anchors).sort()).toEqual([...REQUIRED_ANCHORS].sort());
      expect(
        map.colliders.some(({ id }) =>
          [
            'counter',
            'story-table',
            'rosehip-bed',
            'rosehip-tea-table',
            'bluebell-bell-cabinet',
            'bluebell-chime-table',
            'sunpetal-potting-bench',
          ].includes(id),
        ),
      ).toBe(true);
    }
  });

  it('keeps the Story House desk visually solid from Quill’s front approach', () => {
    const library = getVillageInteriorMap('library');
    const desk = library.colliders.find(({ id }) => id === 'counter');
    const frontClearance = library.colliders.find(({ id }) => id === 'counter-front-clearance');

    expect(desk).toMatchObject({ x: 660, y: 600, width: 300, height: 124 });
    expect(frontClearance).toMatchObject({ x: 660, y: 676, width: 300, height: 48 });
    // With the player's 44px physics body, this bumper produces a centre-line stop around
    // y=722, leaving the taller visible unicorn cleanly in front of the desk.
    expect(isPointBlocked({ x: 660, y: 700 }, library.colliders, 22)).toBe(true);
    expect(library.anchors.counter.approach).toEqual({ x: 660, y: 735 });
    expect(isPointBlocked(library.anchors.counter.approach, library.colliders, 22)).toBe(false);
  });

  it('keeps all interaction approaches reachable from the common player spawn', () => {
    for (const interiorId of INTERIOR_IDS) {
      const map = getVillageInteriorMap(interiorId);
      const unreachable = findUnreachableTargets(
        map,
        Object.values(map.anchors).map((anchor) => ({
          id: `${interiorId}:${anchor.id}`,
          position: anchor.approach,
        })),
        34,
        28,
      );
      expect(unreachable).toEqual([]);
    }
  });
});
