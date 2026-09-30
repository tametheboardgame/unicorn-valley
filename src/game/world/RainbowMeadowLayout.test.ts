import { describe, expect, it } from 'vitest';
import { RAINBOW_MEADOW_LAYOUT, RAINBOW_MEADOW_MAP } from './RainbowMeadowMap';

describe('Rainbow Meadow canonical layout', () => {
  it('projects structural map coordinates from one area-owned layout', () => {
    expect({
      width: RAINBOW_MEADOW_MAP.width,
      height: RAINBOW_MEADOW_MAP.height,
      margin: RAINBOW_MEADOW_MAP.margin,
    }).toEqual(RAINBOW_MEADOW_LAYOUT.bounds);
    expect(RAINBOW_MEADOW_MAP.entrances).toEqual([RAINBOW_MEADOW_LAYOUT.sunbeamGateway]);
    expect(RAINBOW_MEADOW_MAP.raceHub).toBe(RAINBOW_MEADOW_LAYOUT.raceHub);
    expect(RAINBOW_MEADOW_MAP.npcMarkers[0]?.position).toBe(
      RAINBOW_MEADOW_LAYOUT.coreNpcPositions.novaRaceHub,
    );
  });

  it('owns one current structural path network for traversal presentation', () => {
    expect(RAINBOW_MEADOW_LAYOUT.structuralPaths.map(({ id }) => id)).toEqual([
      'main-route',
      'windmill-spur',
      'picnic-spur',
      'rainbow-run-hub-spur',
    ]);
    expect(RAINBOW_MEADOW_LAYOUT.structuralPaths.every(({ points }) => points.length >= 2)).toBe(
      true,
    );
  });

  it('preserves the accepted Crystal Brook route position until H4.4 relocates it', () => {
    expect(RAINBOW_MEADOW_LAYOUT.crystalBrookRoute.transitionPosition).toEqual({
      x: 3030,
      y: 1750,
    });
    const path = RAINBOW_MEADOW_LAYOUT.crystalBrookRoute.pathPoints;
    expect(path[path.length - 1]).toEqual(
      RAINBOW_MEADOW_LAYOUT.crystalBrookRoute.transitionPosition,
    );
  });
});
