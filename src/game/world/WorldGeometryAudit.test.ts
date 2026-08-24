import { describe, expect, it } from 'vitest';
import { CRYSTAL_BROOK_MAP } from './CrystalBrookMap';
import { isPointBlocked } from './MapTraversal';
import { MOONFLOWER_GLADE_MAP } from './MoonflowerGladeMap';
import { RAINBOW_MEADOW_MAP } from './RainbowMeadowMap';
import { SUNBEAM_VILLAGE_MAP } from './SunbeamVillageMap';
import { WHISPERING_WOODS_MAP } from './WhisperingWoodsMap';

const maps = [
  ['Moonflower Glade', MOONFLOWER_GLADE_MAP],
  ['Sunbeam Village', SUNBEAM_VILLAGE_MAP],
  ['Rainbow Meadow', RAINBOW_MEADOW_MAP],
  ['Crystal Brook', CRYSTAL_BROOK_MAP],
  ['Whispering Woods', WHISPERING_WOODS_MAP],
] as const;

describe('exploration geometry audit', () => {
  it('keeps every region spawn and gateway approach clear of hard collision', () => {
    for (const [label, map] of maps) {
      expect(isPointBlocked(map.playerSpawn, map.colliders, 32), `${label} player spawn`).toBe(false);
      for (const entrance of map.entrances) {
        expect(
          isPointBlocked(entrance.approach, map.colliders, 32),
          `${label} entrance ${entrance.id}`,
        ).toBe(false);
      }
    }
  });

  it('keeps Crystal Brook stepping stones and the visible main route traversable', () => {
    for (const stone of CRYSTAL_BROOK_MAP.steppingStones) {
      expect(isPointBlocked(stone, CRYSTAL_BROOK_MAP.colliders, 28)).toBe(false);
    }

    const mainRoute = [
      { x: 340, y: 1090 },
      { x: 850, y: 1090 },
      { x: 1510, y: 1260 },
      { x: 2050, y: 1080 },
      { x: 2600, y: 1190 },
      { x: 3070, y: 1010 },
    ];
    for (const point of mainRoute) {
      expect(isPointBlocked(point, CRYSTAL_BROOK_MAP.colliders, 34)).toBe(false);
    }
  });

  it('keeps the Whispering Woods guiding-light route free of invisible walls', () => {
    const mainRoute = [
      { x: 350, y: 1090 },
      { x: 720, y: 1090 },
      { x: 1230, y: 980 },
      { x: 1680, y: 1110 },
      { x: 2090, y: 1080 },
      { x: 2530, y: 930 },
      { x: 2940, y: 820 },
    ];
    for (const point of mainRoute) {
      expect(isPointBlocked(point, WHISPERING_WOODS_MAP.colliders, 34)).toBe(false);
    }
  });
});
