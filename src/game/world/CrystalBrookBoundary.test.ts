import { describe, expect, it } from 'vitest';
import {
  CRYSTAL_BROOK_BOUNDARY_OPENINGS,
  CRYSTAL_BROOK_BOUNDARY_ROCKS,
  CRYSTAL_BROOK_MAP,
  CRYSTAL_BROOK_PERIMETER_COLLIDERS,
} from './CrystalBrookMap';

type BoundaryRock = (typeof CRYSTAL_BROOK_BOUNDARY_ROCKS)[number];

function overlapsHorizontalCorridor(rock: BoundaryRock, left: number, right: number): boolean {
  return rock.x + rock.width / 2 > left && rock.x - rock.width / 2 < right;
}

function overlapsVerticalCorridor(rock: BoundaryRock, top: number, bottom: number): boolean {
  return rock.y + rock.height / 2 > top && rock.y - rock.height / 2 < bottom;
}

function expectHorizontalChainClosed(rocks: BoundaryRock[]): void {
  const ordered = [...rocks].sort((a, b) => a.x - b.x);
  for (let index = 0; index < ordered.length - 1; index += 1) {
    const current = ordered[index];
    const next = ordered[index + 1];
    const visualGap = next.x - next.width / 2 - (current.x + current.width / 2);
    expect(visualGap).toBeLessThanOrEqual(8);

    const currentCollider = CRYSTAL_BROOK_PERIMETER_COLLIDERS.find(
      ({ id }) => id === `collision:brook-perimeter:${current.id}`,
    );
    const nextCollider = CRYSTAL_BROOK_PERIMETER_COLLIDERS.find(
      ({ id }) => id === `collision:brook-perimeter:${next.id}`,
    );
    expect(currentCollider).toBeDefined();
    expect(nextCollider).toBeDefined();
    if (!currentCollider || !nextCollider) continue;

    const collisionGap =
      nextCollider.x - nextCollider.width / 2 - (currentCollider.x + currentCollider.width / 2);
    expect(collisionGap).toBeLessThanOrEqual(8);
  }
}

function expectVerticalChainClosed(rocks: BoundaryRock[]): void {
  const ordered = [...rocks].sort((a, b) => a.y - b.y);
  for (let index = 0; index < ordered.length - 1; index += 1) {
    const current = ordered[index];
    const next = ordered[index + 1];
    const visualGap = next.y - next.height / 2 - (current.y + current.height / 2);
    expect(visualGap).toBeLessThanOrEqual(8);

    const currentCollider = CRYSTAL_BROOK_PERIMETER_COLLIDERS.find(
      ({ id }) => id === `collision:brook-perimeter:${current.id}`,
    );
    const nextCollider = CRYSTAL_BROOK_PERIMETER_COLLIDERS.find(
      ({ id }) => id === `collision:brook-perimeter:${next.id}`,
    );
    expect(currentCollider).toBeDefined();
    expect(nextCollider).toBeDefined();
    if (!currentCollider || !nextCollider) continue;

    const collisionGap =
      nextCollider.y - nextCollider.height / 2 - (currentCollider.y + currentCollider.height / 2);
    expect(collisionGap).toBeLessThanOrEqual(12);
  }
}

describe('Crystal Brook H6.4 perimeter', () => {
  it('uses a subtle varied boulder vocabulary instead of oversized repeated monoliths', () => {
    expect(CRYSTAL_BROOK_BOUNDARY_ROCKS.length).toBeGreaterThanOrEqual(50);
    expect(new Set(CRYSTAL_BROOK_BOUNDARY_ROCKS.map(({ id }) => id)).size).toBe(
      CRYSTAL_BROOK_BOUNDARY_ROCKS.length,
    );

    const kinds = new Set(CRYSTAL_BROOK_BOUNDARY_ROCKS.map(({ kind }) => kind));
    expect(kinds).toEqual(new Set(['rounded', 'slab', 'lopsided', 'spire', 'stack', 'shelf']));
    expect(
      CRYSTAL_BROOK_BOUNDARY_ROCKS.filter((rock) => 'crystalColour' in rock).length,
    ).toBeGreaterThanOrEqual(5);
    expect(Math.max(...CRYSTAL_BROOK_BOUNDARY_ROCKS.map(({ width }) => width))).toBeLessThanOrEqual(
      230,
    );
    expect(
      Math.max(...CRYSTAL_BROOK_BOUNDARY_ROCKS.map(({ height }) => height)),
    ).toBeLessThanOrEqual(160);
  });

  it('closes accidental perimeter gaps while retaining the authored openings', () => {
    expectHorizontalChainClosed(
      CRYSTAL_BROOK_BOUNDARY_ROCKS.filter(
        ({ id }) => id.startsWith('north-') && !id.includes('16-') && !id.includes('17-'),
      ),
    );
    expectHorizontalChainClosed(
      CRYSTAL_BROOK_BOUNDARY_ROCKS.filter(
        ({ id }) => id === 'north-16-cup-shoulder' || id === 'north-17-east-shelf',
      ),
    );
    expectVerticalChainClosed(
      CRYSTAL_BROOK_BOUNDARY_ROCKS.filter(({ id }) => id.startsWith('west-upper-')),
    );
    expectVerticalChainClosed(
      CRYSTAL_BROOK_BOUNDARY_ROCKS.filter(({ id }) => id.startsWith('west-lower-')),
    );
    expectVerticalChainClosed(
      CRYSTAL_BROOK_BOUNDARY_ROCKS.filter(
        ({ id }) =>
          id.startsWith('east-woodland-') &&
          ![
            'east-woodland-04',
            'east-woodland-05',
            'east-woodland-06',
            'east-woodland-07',
          ].includes(id) &&
          Number(id.slice('east-woodland-'.length)) <= 3,
      ),
    );
    expectVerticalChainClosed(
      CRYSTAL_BROOK_BOUNDARY_ROCKS.filter(({ id }) =>
        ['east-woodland-04', 'east-woodland-05', 'east-woodland-06', 'east-woodland-07'].includes(
          id,
        ),
      ),
    );
    expectVerticalChainClosed(
      CRYSTAL_BROOK_BOUNDARY_ROCKS.filter(({ id }) =>
        ['east-woodland-08', 'east-woodland-09', 'east-woodland-10'].includes(id),
      ),
    );
    expectHorizontalChainClosed(
      CRYSTAL_BROOK_BOUNDARY_ROCKS.filter(({ id }) => {
        const match = /^south-(\d+)-/.exec(id);
        return match !== null && Number(match[1]) <= 12;
      }),
    );
    expectHorizontalChainClosed(
      CRYSTAL_BROOK_BOUNDARY_ROCKS.filter(({ id }) => {
        const match = /^south-(\d+)-/.exec(id);
        return match !== null && Number(match[1]) >= 13;
      }),
    );

    const westRim = CRYSTAL_BROOK_BOUNDARY_ROCKS.filter(({ x }) => x < 300);
    expect(westRim.some((rock) => overlapsVerticalCorridor(rock, 760, 1450))).toBe(false);

    const northRim = CRYSTAL_BROOK_BOUNDARY_ROCKS.filter(({ y }) => y < 330);
    expect(northRim.some((rock) => overlapsHorizontalCorridor(rock, 2660, 3060))).toBe(false);

    const eastRim = CRYSTAL_BROOK_BOUNDARY_ROCKS.filter(({ x }) => x > 3250);
    expect(eastRim.some((rock) => overlapsVerticalCorridor(rock, 1430, 1740))).toBe(false);

    const southRim = CRYSTAL_BROOK_BOUNDARY_ROCKS.filter(({ y }) => y > 1950);
    expect(southRim.some((rock) => overlapsHorizontalCorridor(rock, 2200, 2680))).toBe(false);

    expect(CRYSTAL_BROOK_BOUNDARY_OPENINGS.map(({ id }) => id)).toEqual([
      'rainbow-meadow-gorge',
      'whispering-woods-pass',
      'crystal-cup-route',
      'crystal-grotto-route',
    ]);
  });

  it('uses a small set of continuous perimeter collision strips instead of one body per rock', () => {
    expect(CRYSTAL_BROOK_PERIMETER_COLLIDERS).toHaveLength(9);
    expect(CRYSTAL_BROOK_PERIMETER_COLLIDERS.length).toBeLessThan(
      CRYSTAL_BROOK_BOUNDARY_ROCKS.length / 4,
    );

    expect(CRYSTAL_BROOK_PERIMETER_COLLIDERS.map(({ id }) => id)).toEqual([
      'collision:brook-perimeter:north-west',
      'collision:brook-perimeter:north-east',
      'collision:brook-perimeter:west-upper',
      'collision:brook-perimeter:west-lower',
      'collision:brook-perimeter:east-upper',
      'collision:brook-perimeter:east-middle',
      'collision:brook-perimeter:east-lower',
      'collision:brook-perimeter:south-west',
      'collision:brook-perimeter:south-east',
    ]);

    expect(CRYSTAL_BROOK_MAP.colliders.some(({ id }) => id === 'collision:cliff-west')).toBe(false);
    expect(CRYSTAL_BROOK_MAP.colliders.some(({ id }) => id === 'collision:cliff-east')).toBe(false);
    expect(
      CRYSTAL_BROOK_MAP.colliders.filter(({ id }) => id.startsWith('collision:brook-perimeter:')),
    ).toHaveLength(9);
  });
});
