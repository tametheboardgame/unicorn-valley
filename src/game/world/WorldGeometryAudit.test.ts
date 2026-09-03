import { describe, expect, it } from 'vitest';
import { CRYSTAL_BROOK_MAP } from './CrystalBrookMap';
import { EXPLORATION_MAIN_ROUTES, type ExplorationPathPoint } from './ExplorationPathPolishManager';
import { isPointBlocked, type CollisionRectangle } from './MapTraversal';
import { MOONFLOWER_GLADE_MAP } from './MoonflowerGladeMap';
import { RAINBOW_MEADOW_MAP } from './RainbowMeadowMap';
import { STARLIGHT_BEACH_MAP } from './StarlightBeachMap';
import { SUNBEAM_VILLAGE_MAP } from './SunbeamVillageMap';
import { WHISPERING_WOODS_MAP } from './WhisperingWoodsMap';

interface AuditedMap {
  width: number;
  height: number;
  margin: number;
  playerSpawn: ExplorationPathPoint;
  entrances: readonly { id: string; approach: ExplorationPathPoint }[];
  colliders: readonly CollisionRectangle[];
}

const maps: readonly [string, string, AuditedMap][] = [
  ['Moonflower Glade', 'MoonflowerGladeScene', MOONFLOWER_GLADE_MAP],
  ['Sunbeam Village', 'SunbeamVillageScene', SUNBEAM_VILLAGE_MAP],
  ['Rainbow Meadow', 'RainbowMeadowScene', RAINBOW_MEADOW_MAP],
  ['Crystal Brook', 'CrystalBrookScene', CRYSTAL_BROOK_MAP],
  ['Whispering Woods', 'WhisperingWoodsScene', WHISPERING_WOODS_MAP],
  ['Starlight Beach', 'StarlightBeachScene', STARLIGHT_BEACH_MAP],
];

function sampleRoute(points: readonly ExplorationPathPoint[], spacing = 34): ExplorationPathPoint[] {
  const samples: ExplorationPathPoint[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    const steps = Math.max(1, Math.ceil(distance / spacing));
    for (let step = 0; step < steps; step += 1) {
      const progress = step / steps;
      samples.push({
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress,
      });
    }
  }
  samples.push(points[points.length - 1]);
  return samples;
}

describe('exploration geometry audit', () => {
  it('keeps every region spawn and gateway approach clear of hard collision', () => {
    for (const [label, , map] of maps) {
      expect(isPointBlocked(map.playerSpawn, map.colliders, 30), `${label} player spawn`).toBe(
        false,
      );
      for (const entrance of map.entrances) {
        expect(
          isPointBlocked(entrance.approach, map.colliders, 30),
          `${label} entrance ${entrance.id}`,
        ).toBe(false);
      }
    }
  });

  it('keeps every authored main path continuously traversable, not just a few checkpoints', () => {
    for (const [label, sceneKey, map] of maps) {
      const route = EXPLORATION_MAIN_ROUTES[sceneKey];
      expect(route, `${label} route contract`).toBeDefined();
      for (const point of sampleRoute(route)) {
        expect(
          isPointBlocked(point, map.colliders, 28),
          `${label} route near (${Math.round(point.x)}, ${Math.round(point.y)})`,
        ).toBe(false);
      }
    }
  });

  it('keeps every collider inside the visible world and gives each one a unique id', () => {
    for (const [label, , map] of maps) {
      const ids = new Set<string>();
      for (const collider of map.colliders) {
        expect(ids.has(collider.id), `${label} duplicate collider ${collider.id}`).toBe(false);
        ids.add(collider.id);
        expect(collider.width, `${label} ${collider.id} width`).toBeGreaterThan(0);
        expect(collider.height, `${label} ${collider.id} height`).toBeGreaterThan(0);
        expect(collider.x - collider.width / 2, `${label} ${collider.id} left`).toBeGreaterThanOrEqual(
          0,
        );
        expect(collider.y - collider.height / 2, `${label} ${collider.id} top`).toBeGreaterThanOrEqual(
          0,
        );
        expect(collider.x + collider.width / 2, `${label} ${collider.id} right`).toBeLessThanOrEqual(
          map.width,
        );
        expect(
          collider.y + collider.height / 2,
          `${label} ${collider.id} bottom`,
        ).toBeLessThanOrEqual(map.height);
      }
    }
  });

  it('keeps Crystal Brook stepping stones physically reachable', () => {
    for (const stone of CRYSTAL_BROOK_MAP.steppingStones) {
      expect(isPointBlocked(stone, CRYSTAL_BROOK_MAP.colliders, 26)).toBe(false);
    }
  });

  it('keeps Beach discovery targets out of hard collision footprints', () => {
    for (const spot of STARLIGHT_BEACH_MAP.discoverySpots) {
      expect(
        isPointBlocked(spot.position, STARLIGHT_BEACH_MAP.colliders, 18),
        `Beach discovery ${spot.id}`,
      ).toBe(false);
    }
  });
});
