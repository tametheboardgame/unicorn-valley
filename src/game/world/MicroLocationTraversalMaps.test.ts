import { describe, expect, it } from 'vitest';
import { findClickNavigationPath } from '../input/ClickNavigationPath';
import { CRYSTAL_GROTTO_MAP, FIREFLY_GROVE_MAP } from './MicroLocationTraversalMaps';

describe.each([
  ['Crystal Grotto', CRYSTAL_GROTTO_MAP],
  ['Firefly Grove', FIREFLY_GROVE_MAP],
] as const)('%s traversal map', (_label, map) => {
  it('routes taps around authored colliders and recovers blocked targets', () => {
    const openTarget = { x: 1080, y: 570 };
    const openPath = findClickNavigationPath(map, map.playerSpawn, openTarget);
    expect(openPath.length).toBeGreaterThan(0);
    expect(openPath.at(-1)?.x).toBeGreaterThan(900);

    const blocked = map.colliders.at(-1);
    expect(blocked).toBeDefined();
    const recoveredPath = findClickNavigationPath(map, map.playerSpawn, {
      x: blocked?.x ?? 0,
      y: blocked?.y ?? 0,
    });
    expect(recoveredPath.length).toBeGreaterThan(0);
    expect(recoveredPath.at(-1)).not.toEqual({ x: blocked?.x, y: blocked?.y });
  });
});
