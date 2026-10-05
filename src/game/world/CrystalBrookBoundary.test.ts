import { describe, expect, it } from 'vitest';
import {
  CRYSTAL_BROOK_BOUNDARY_OPENINGS,
  CRYSTAL_BROOK_BOUNDARY_ROCKS,
  CRYSTAL_BROOK_MAP,
  CRYSTAL_BROOK_PERIMETER_COLLIDERS,
} from './CrystalBrookMap';

function overlapsHorizontalCorridor(
  rock: (typeof CRYSTAL_BROOK_BOUNDARY_ROCKS)[number],
  left: number,
  right: number,
): boolean {
  return rock.x + rock.width / 2 > left && rock.x - rock.width / 2 < right;
}

function overlapsVerticalCorridor(
  rock: (typeof CRYSTAL_BROOK_BOUNDARY_ROCKS)[number],
  top: number,
  bottom: number,
): boolean {
  return rock.y + rock.height / 2 > top && rock.y - rock.height / 2 < bottom;
}

describe('Crystal Brook H6.4 perimeter', () => {
  it('uses a varied authored rock vocabulary instead of repeated scale copies', () => {
    expect(CRYSTAL_BROOK_BOUNDARY_ROCKS.length).toBeGreaterThanOrEqual(28);
    expect(new Set(CRYSTAL_BROOK_BOUNDARY_ROCKS.map(({ id }) => id)).size).toBe(
      CRYSTAL_BROOK_BOUNDARY_ROCKS.length,
    );

    const kinds = new Set(CRYSTAL_BROOK_BOUNDARY_ROCKS.map(({ kind }) => kind));
    expect(kinds).toEqual(new Set(['rounded', 'slab', 'lopsided', 'spire', 'stack', 'shelf']));
    expect(CRYSTAL_BROOK_BOUNDARY_ROCKS.filter(({ crystalColour }) => crystalColour !== undefined).length)
      .toBeGreaterThanOrEqual(5);
  });

  it('keeps the four authored land-route openings clear', () => {
    const westRim = CRYSTAL_BROOK_BOUNDARY_ROCKS.filter(({ x }) => x < 300);
    expect(westRim.some((rock) => overlapsVerticalCorridor(rock, 760, 1450))).toBe(false);

    const northRim = CRYSTAL_BROOK_BOUNDARY_ROCKS.filter(({ y }) => y < 330);
    expect(northRim.some((rock) => overlapsHorizontalCorridor(rock, 2640, 3060))).toBe(false);

    const eastRim = CRYSTAL_BROOK_BOUNDARY_ROCKS.filter(({ x }) => x > 3250);
    expect(eastRim.some((rock) => overlapsVerticalCorridor(rock, 1400, 1740))).toBe(false);

    const southRim = CRYSTAL_BROOK_BOUNDARY_ROCKS.filter(({ y }) => y > 1950);
    expect(southRim.some((rock) => overlapsHorizontalCorridor(rock, 2200, 2680))).toBe(false);

    expect(CRYSTAL_BROOK_BOUNDARY_OPENINGS.map(({ id }) => id)).toEqual([
      'rainbow-meadow-gorge',
      'whispering-woods-pass',
      'crystal-cup-route',
      'crystal-grotto-route',
    ]);
  });

  it('derives perimeter collision from the visible rock formations', () => {
    expect(CRYSTAL_BROOK_PERIMETER_COLLIDERS).toHaveLength(CRYSTAL_BROOK_BOUNDARY_ROCKS.length);

    for (const rock of CRYSTAL_BROOK_BOUNDARY_ROCKS) {
      const collider = CRYSTAL_BROOK_PERIMETER_COLLIDERS.find(
        ({ id }) => id === `collision:brook-perimeter:${rock.id}`,
      );
      expect(collider).toBeDefined();
      expect(collider?.x).toBe(rock.x);
      expect(collider?.y).toBe(rock.y + rock.collisionOffsetY);
      expect(collider?.width).toBeCloseTo(rock.width * rock.collisionScaleX);
      expect(collider?.height).toBeCloseTo(rock.height * rock.collisionScaleY);
    }

    expect(CRYSTAL_BROOK_MAP.colliders.some(({ id }) => id === 'collision:cliff-west')).toBe(false);
    expect(CRYSTAL_BROOK_MAP.colliders.some(({ id }) => id === 'collision:cliff-east')).toBe(false);
    expect(
      CRYSTAL_BROOK_MAP.colliders.filter(({ id }) => id.startsWith('collision:brook-perimeter:')),
    ).toHaveLength(CRYSTAL_BROOK_BOUNDARY_ROCKS.length);
  });
});
