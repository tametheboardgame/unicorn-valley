import { describe, expect, it } from 'vitest';
import { isPointBlocked } from '../world/MapTraversal';
import { SUNBEAM_VILLAGE_LAYOUT } from '../world/SunbeamVillageLayout';
import { SUNBEAM_VILLAGE_MAP } from '../world/SunbeamVillageMap';
import {
  R6_AMBIENT_RESIDENT_PLACEMENTS,
  R6_SMALL_WORLD_INTERACTIONS,
  R6_SUPPORTING_RESIDENTS,
} from './R6SupportingResidentContent';

function requirePlacement(residentId: string, sceneKey: string) {
  const placement = R6_AMBIENT_RESIDENT_PLACEMENTS.find(
    (candidate) => candidate.residentId === residentId && candidate.sceneKey === sceneKey,
  );
  if (!placement) {
    throw new Error(`Missing placement for ${residentId} in ${sceneKey}`);
  }
  return placement;
}

describe('R6.5 functional resident placements', () => {
  it('gives Echo a reachable Crystal Brook route with a child-clear interaction radius', () => {
    const echo = requirePlacement('resident:echo', 'CrystalBrookScene');

    expect(echo.interactionRadius).toBeGreaterThanOrEqual(140);
    expect(echo.waypoints.length).toBeGreaterThanOrEqual(2);
    expect(echo.waypoints[0]).toMatchObject({ x: 2860, y: 1690 });
  });

  it('keeps Fern on the shared interactive resident runtime instead of a visual-only bridge', () => {
    const fern = requirePlacement('resident:fern', 'WhisperingWoodsScene');

    expect(fern.interactionRadius).toBeGreaterThanOrEqual(130);
    expect(fern.waypoints.length).toBeGreaterThanOrEqual(2);
  });

  it('puts Maple on the bakery approach rather than the remote south-east village route', () => {
    const maple = requirePlacement('resident:maple', 'SunbeamVillageScene');

    expect(maple.waypoints[0]).toMatchObject({
      x: SUNBEAM_VILLAGE_LAYOUT.buildings.bakery.x - 20,
      y: SUNBEAM_VILLAGE_LAYOUT.buildings.bakery.approach.y + 75,
    });
    expect(maple.waypoints.every(({ x, y }) => x >= 680 && x <= 1000 && y <= 1050)).toBe(true);
    expect(
      maple.waypoints.every((point) => !isPointBlocked(point, SUNBEAM_VILLAGE_MAP.colliders, 46)),
    ).toBe(true);
  });

  it('routes Tansy from the Story House edge into a readable east-plaza gathering pocket', () => {
    const tansy = requirePlacement('resident:tansy', 'SunbeamVillageScene');

    expect(tansy.waypoints).toHaveLength(3);
    expect(tansy.waypoints[0]).toMatchObject({
      x: SUNBEAM_VILLAGE_LAYOUT.buildings.library.x - 210,
      y: SUNBEAM_VILLAGE_LAYOUT.buildings.library.approach.y + 40,
    });
    expect(
      tansy.waypoints.every((point) => !isPointBlocked(point, SUNBEAM_VILLAGE_MAP.colliders, 46)),
    ).toBe(true);
  });
});

describe('R6.5 H3.10 playground life', () => {
  it('promotes all four playground children into the shared resident runtime at child scale', () => {
    for (const id of ['poppy', 'milo', 'lulu', 'bean'] as const) {
      expect(R6_SUPPORTING_RESIDENTS.some((resident) => resident.id === `resident:${id}`)).toBe(
        true,
      );
      const placement = requirePlacement(`resident:${id}`, 'SunbeamVillageScene');
      expect('presentationScale' in placement ? placement.presentationScale : 1).toBeLessThan(0.7);
      expect(placement.waypoints).toHaveLength(2);
      expect(
        placement.waypoints.every(
          ({ x, y }) =>
            Math.abs(x - SUNBEAM_VILLAGE_LAYOUT.playground.x) <=
              SUNBEAM_VILLAGE_LAYOUT.playground.width / 2 &&
            Math.abs(y - SUNBEAM_VILLAGE_LAYOUT.playground.y) <=
              SUNBEAM_VILLAGE_LAYOUT.playground.height / 2,
        ),
      ).toBe(true);
    }
  });

  it('provides shared Play interactions for the slide, seesaw and climbing frame', () => {
    const playgroundInteractions = R6_SMALL_WORLD_INTERACTIONS.filter((interaction) =>
      interaction.id.startsWith('world-interaction:r6-5:village-playground-'),
    );

    expect(playgroundInteractions).toHaveLength(3);
    expect(playgroundInteractions.every((interaction) => interaction.kind === 'play')).toBe(true);
    expect(playgroundInteractions.map((interaction) => interaction.actionLabel)).toEqual([
      'Play',
      'Play',
      'Play',
    ]);
  });

  it('adds collision only to the three solid playground equipment pieces', () => {
    const playgroundColliders = SUNBEAM_VILLAGE_MAP.colliders.filter((collider) =>
      collider.id.startsWith('collision:playground:'),
    );

    expect(playgroundColliders.map(({ id }) => id).sort()).toEqual([
      'collision:playground:climbingFrame',
      'collision:playground:seesaw',
      'collision:playground:slide',
    ]);
  });
});
