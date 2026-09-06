import { describe, expect, it } from 'vitest';
import { isPointBlocked } from '../world/MapTraversal';
import { SUNBEAM_VILLAGE_MAP } from '../world/SunbeamVillageMap';
import { R6_AMBIENT_RESIDENT_PLACEMENTS } from './R6SupportingResidentContent';

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

  it(
    'keeps Fern on the shared interactive resident runtime instead of a visual-only bridge',
    () => {
      const fern = requirePlacement('resident:fern', 'WhisperingWoodsScene');

      expect(fern.interactionRadius).toBeGreaterThanOrEqual(130);
      expect(fern.waypoints.length).toBeGreaterThanOrEqual(2);
    },
  );

  it('puts Maple on the bakery approach rather than the remote south-east village route', () => {
    const maple = requirePlacement('resident:maple', 'SunbeamVillageScene');

    expect(maple.waypoints[0]).toMatchObject({ x: 900, y: 760 });
    expect(maple.waypoints.every(({ x, y }) => x <= 1250 && y <= 950)).toBe(true);
    expect(
      maple.waypoints.every(
        (point) => !isPointBlocked(point, SUNBEAM_VILLAGE_MAP.colliders, 46),
      ),
    ).toBe(true);
  });
});
