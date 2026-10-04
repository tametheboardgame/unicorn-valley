import { describe, expect, it } from 'vitest';
import { CRYSTAL_CUP_HUB_LAYOUT, CRYSTAL_CUP_HUB_MAP } from './CrystalCupHubMap';

describe('Crystal Cup Raceway hub shell', () => {
  it('owns a distinct traversable space between Crystal Brook and Crystal Cascade', () => {
    expect(CRYSTAL_CUP_HUB_MAP.width).toBe(1800);
    expect(CRYSTAL_CUP_HUB_MAP.height).toBe(1100);
    expect(CRYSTAL_CUP_HUB_MAP.playerSpawn).toEqual(CRYSTAL_CUP_HUB_LAYOUT.playerSpawn);
    expect(CRYSTAL_CUP_HUB_LAYOUT.raceGate.position.y).toBeLessThan(
      CRYSTAL_CUP_HUB_LAYOUT.raceGate.approach.y,
    );
    expect(CRYSTAL_CUP_HUB_LAYOUT.brookExit.position.y).toBeGreaterThan(
      CRYSTAL_CUP_HUB_LAYOUT.brookExit.approach.y,
    );
  });

  it('keeps the shell intentionally simple for later race-hub design work', () => {
    expect(CRYSTAL_CUP_HUB_MAP.colliders).toEqual([]);
    expect(CRYSTAL_CUP_HUB_LAYOUT.pathPoints.at(0)).toEqual(
      CRYSTAL_CUP_HUB_LAYOUT.brookExit.position,
    );
    expect(CRYSTAL_CUP_HUB_LAYOUT.pathPoints.at(-1)).toEqual(
      CRYSTAL_CUP_HUB_LAYOUT.raceGate.position,
    );
  });
});
